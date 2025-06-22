const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { sendNotification } = require('../utils/sendNotification');
const { renderTemplate } = require('../utils/notificationTemplates');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY;

// Helper: Log wallet actions
function logWalletAction(userId, action, details) {
  logger.info({ userId, action, ...details });
}

// Placeholder for rate limiting/fraud check (implement as needed)
async function checkRateLimitOrFraud(userId, action) {
  // Example: throw new Error('Too many requests');
}

// Format helpers
const maskAccount = (acc) => acc ? acc.slice(0, 3) + '**' + acc.slice(-3) : '***';
const formatNaira = (num) => 'NGN' + Number(num).toLocaleString('en-NG', { minimumFractionDigits: 2 });

// --- SQUAD VIRTUAL ACCOUNT CREATION ---
async function createSquadVirtualAccount(payload) {
  // Remove empty/undefined/null fields (especially middle_name)
  Object.keys(payload).forEach(key => {
    if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  // Format dob to mm/dd/yyyy if needed
  if (payload.dob && /^\d{4}-\d{2}-\d{2}$/.test(payload.dob)) {
    const [year, month, day] = payload.dob.split('-');
    payload.dob = `${month}/${day}/${year}`;
  }

  const squadRes = await axios.post(
    'https://sandbox-api-d.squadco.com/virtual-account',
    payload,
    {
      headers: {
        Authorization: `Bearer ${SQUAD_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return squadRes.data;
}

// 📘 Get Wallet Balance & Account Info
exports.getBalance = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  try {
    await checkRateLimitOrFraud(req.user.id, 'getBalance');
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    logWalletAction(req.user.id, 'getBalance', { balance: wallet.balance });
    res.status(200).json({
      balance: wallet.balance,
      accountNumber: wallet.accountNumber,
      bankName: wallet.bankName,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve balance', error: err.message });
  }
};

// 💰 Manual Wallet Funding (for admin/testing only)
exports.fundWallet = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  const { amount } = req.body;
  const value = parseFloat(amount);

  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    // 1. Get user email
    const user = await db.User.findOne({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Initialize Paystack transaction
    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: Math.round(value * 100),
        callback_url: "https://modernpay-backend.onrender.com/approve-transfer",
        metadata: {
          userId: user.id,
          purpose: 'wallet_funding'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Paystack initialize response:', paystackRes.data);

    // 3. Return authorization URL to frontend
    const { authorization_url, access_code, reference } = paystackRes.data.data;
    res.status(200).json({
      status: 'Payment initialized',
      authorization_url,
      access_code,
      reference
    });
  } catch (err) {
    console.error('Fund wallet error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to initialize payment', error: err.response?.data || err.message });
  }
};

// 🔁 Transfer to another user via account number
exports.transferFunds = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  const { recipientAccountNumber, amount } = req.body;
  const value = parseFloat(amount);

  if (!recipientAccountNumber || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid transfer input' });
  }

  const t = await db.sequelize.transaction();
  try {
    await checkRateLimitOrFraud(req.user.id, 'transferFunds');
    const senderWallet = await db.Wallet.findOne({ where: { userId: req.user.id }, transaction: t });
    const recipientWallet = await db.Wallet.findOne({ where: { accountNumber: recipientAccountNumber }, transaction: t });

    if (!recipientWallet) return res.status(404).json({ message: 'Recipient not found' });
    if (recipientWallet.userId === req.user.id) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    if (!senderWallet || parseFloat(senderWallet.balance) < value) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Fetch sender and recipient user info
    const senderUser = await db.User.findOne({ where: { id: req.user.id } });
    const recipientUser = await db.User.findOne({ where: { id: recipientWallet.userId } });

    senderWallet.balance = parseFloat(senderWallet.balance) - value;
    recipientWallet.balance = parseFloat(recipientWallet.balance) + value;
    await senderWallet.save({ transaction: t });
    await recipientWallet.save({ transaction: t });

    await db.Transaction.bulkCreate([
      {
        userId: req.user.id,
        type: 'debit',
        amount: value,
        reference: uuidv4(),
        description: `Transfer to ${recipientAccountNumber}`,
        status: 'success',
        category: 'Wallet Transfer',
        senderName:
          senderWallet.accountName ||
          senderUser.fullName ||
          senderUser.name ||
          senderUser.email ||
          'You',
        senderAccountNumber: senderWallet.accountNumber || null,
        recipientName:
          recipientWallet.accountName ||
          recipientUser.fullName ||
          recipientUser.name ||
          recipientUser.email ||
          'Recipient',
        recipientAccount: recipientWallet.accountNumber || null,
        bankName: null, // Not needed for wallet transfer
      },
      {
        userId: recipientWallet.userId,
        type: 'credit',
        amount: value,
        reference: uuidv4(),
        description: `Received from ${senderWallet.accountNumber}`,
        status: 'success',
        category: 'Wallet Transfer',
        senderName:
          senderWallet.accountName ||
          senderUser.fullName ||
          senderUser.name ||
          senderUser.email ||
          'Sender',
        senderAccountNumber: senderWallet.accountNumber || null,
        recipientName:
          recipientWallet.accountName ||
          recipientUser.fullName ||
          recipientUser.name ||
          recipientUser.email ||
          'You',
        recipientAccount: recipientWallet.accountNumber || null,
        bankName: null,
      },
    ], { transaction: t });

    // Debit notification for sender (with template)
    const senderMaskedAcc = maskAccount(senderWallet.accountNumber || '');
    await sendNotification(
      senderUser,
      '',
      'Wallet Debit',
      null,
      'walletDebit',
      {
        amount: formatNaira(value),
        account: senderMaskedAcc,
        recipient: recipientUser.fullName || recipientUser.name || recipientUser.email,
        date: new Date().toLocaleDateString('en-GB'),
        balance: formatNaira(senderWallet.balance)
      }
    );

    // Credit notification for recipient (with template)
    const recipientMaskedAcc = maskAccount(recipientWallet.accountNumber || '');
    await sendNotification(
      recipientUser,
      '',
      'Wallet Credit',
      null,
      'walletCredit',
      {
        amount: formatNaira(value),
        account: recipientMaskedAcc,
        sender: senderUser.fullName || senderUser.name || senderUser.email,
        date: new Date().toLocaleDateString('en-GB'),
        balance: formatNaira(recipientWallet.balance)
      }
    );

    await t.commit();

    logWalletAction(req.user.id, 'transferFunds', { to: recipientAccountNumber, amount: value });
    res.status(200).json({ message: 'Transfer successful', senderBalance: senderWallet.balance });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Transfer failed', error: err.message });
  }
};

// 🏦 Transfer to Bank using Paystack (with PIN validation)
exports.transferToBank = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  const { bankCode, accountNumber, amount, narration, pin } = req.body;
  const value = parseFloat(amount);

  if (!bankCode || !accountNumber || isNaN(value) || value <= 0 || !pin) {
    return res.status(400).json({ message: 'Invalid transfer input. PIN is required.' });
  }

  try {
    // 1. Validate PIN
    const user = await db.User.findOne({ where: { id: req.user.id } });
    if (!user || !user.transactionPin) {
      return res.status(400).json({ message: 'Transaction PIN not set.' });
    }
    const pinMatch = await bcrypt.compare(pin, user.transactionPin);
    if (!pinMatch) {
      return res.status(401).json({ message: 'Incorrect transaction PIN.' });
    }

    await checkRateLimitOrFraud(req.user.id, 'transferToBank');
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet || parseFloat(wallet.balance) < value) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 1. Create transfer recipient
    const recipientRes = await axios.post('https://api.paystack.co/transferrecipient', {
      type: "nuban",
      name: user.fullName || user.name || "User",
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN"
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    console.log('Paystack recipient response:', recipientRes.data);

    const recipientCode = recipientRes.data.data.recipient_code;

    // 2. Initiate transfer
    const displayName = (user.fullName || user.name || 'User').toUpperCase();
    const formattedReason = `ModernPay/${displayName}:${accountNumber}`;
    const transferRes = await axios.post('https://api.paystack.co/transfer', {
      source: "balance",
      amount: Math.round(value * 100), // Paystack expects kobo
      recipient: recipientCode,
      reason: formattedReason
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    console.log('Paystack transfer response:', transferRes.data);

    // Deduct from wallet if transfer is successful
    if (
      transferRes.data.data.status === 'success' ||
      transferRes.data.data.status === 'pending' ||
      transferRes.data.data.status === 'received'
    ) {
      wallet.balance = parseFloat(wallet.balance) - value;
      await wallet.save();

      await db.Transaction.create({
        userId: req.user.id,
        type: 'debit',
        amount: value,
        reference: transferRes.data.data.reference,
        description: formattedReason,
        status: transferRes.data.data.status,
        category: 'Bank Transfer',
        senderName:
          wallet.accountName ||
          user.fullName ||
          user.name ||
          user.email ||
          'You',
        senderAccountNumber: wallet.accountNumber || null,
        recipientName:
          recipientRes.data.data.details?.account_name ||
          'Recipient',
        recipientAccount: accountNumber,
        bankName: recipientRes.data.data.details?.bank_name || null,
      });

      // Notify user with template
      await sendNotification(
        user,
        '',
        'Wallet Debit',
        null,
        'walletDebit',
        {
          amount: formatNaira(value),
          account: maskAccount(wallet.accountNumber || ''),
          recipient: recipientRes.data.data.details?.account_name || 'Recipient',
          date: new Date().toLocaleDateString('en-GB'),
          balance: formatNaira(wallet.balance)
        }
      );

      logWalletAction(req.user.id, 'transferToBank', { bankCode, accountNumber, amount: value });
      return res.status(200).json({ message: 'Bank transfer initiated', transfer: transferRes.data.data });
    } else {
      return res.status(400).json({ message: 'Bank transfer failed', transfer: transferRes.data.data });
    }
  } catch (err) {
    console.error('Bank transfer error:', err.response?.data || err.message);
    res.status(500).json({
      message: 'Bank transfer failed',
      error: err.response?.data?.message || err.message
    });
  }
};

// 🏦 Create Virtual Account using Paystack or Squad
exports.createVirtualAccount = async (req, res) => {
  console.log('createVirtualAccount called', req.body);
  // Accept all possible fields for both Paystack and Squad
  const {
    email,
    firstName,
    lastName,
    middleName,
    preferred_bank,
    phone,
    dob,
    address,
    gender,
    bvn,
    beneficiary_account,
    provider = 'paystack'
  } = req.body;
  try {
    // 1. Check if user exists in your DB
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Check if user already has a virtual account for this provider
    const existingAccount = await db.VirtualAccount.findOne({ where: { userId: user.id, provider } });
    if (existingAccount) {
      return res.status(200).json({ message: 'Virtual account already exists', account: existingAccount });
    }

    let savedAccount;

    if (provider === 'paystack') {
      // 3. Validate preferred bank
      const supportedBanksRes = await axios.get('https://api.paystack.co/bank?type=dedicated_account', {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });
      const supportedBanks = supportedBanksRes.data.data.map(b => b.slug);
      if (!supportedBanks.includes(preferred_bank)) {
        return res.status(400).json({ message: 'Selected bank is not supported for virtual accounts.' });
      }

      // 4. Create or fetch Paystack customer
      let customerCode = user.paystackCustomerCode;
      if (!customerCode) {
        const customerRes = await axios.post(
          'https://api.paystack.co/customer',
          {
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            bvn,
          },
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        customerCode = customerRes.data.data.customer_code;
        user.paystackCustomerCode = customerCode;
        await user.save();
      }

      // 5. Create virtual account via Paystack
      const response = await axios.post(
        'https://api.paystack.co/dedicated_account',
        {
          customer: customerCode,
          preferred_bank: preferred_bank,
          first_name: firstName,
          last_name: lastName,
          bvn,
          phone,
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // 6. Store returned account details in your DB
      const accountData = response.data.data;
      savedAccount = await db.VirtualAccount.create({
        userId: user.id,
        accountNumber: accountData.account_number,
        bankName: accountData.bank.name,
        bankId: accountData.bank.id,
        accountName: accountData.account_name,
        paystackCustomerCode:
          typeof accountData.customer === 'string'
            ? accountData.customer
            : accountData.customer?.customer_code || user.paystackCustomerCode,
        paystackAccountId: accountData.id,
        raw: accountData,
        provider: 'paystack'
      });

      // 7. Update user's wallet with the new virtual account number and bank name
      await db.Wallet.update(
        {
          accountNumber: savedAccount.accountNumber,
          bankName: savedAccount.bankName,
          accountName: savedAccount.accountName
        },
        { where: { userId: user.id } }
      );
    } else if (provider === 'squad') {
      if (
        !firstName || !lastName || !phone || !dob || !address ||
        !gender || !bvn || !beneficiary_account
      ) {
        return res.status(400).json({ message: 'Missing required fields for Squad virtual account.' });
      }
      // Build Squad payload, OMIT middle_name if empty
      const squadPayload = {
        customer_identifier: user.id.toString(),
        first_name: firstName,
        last_name: lastName,
        mobile_num: phone,
        dob,
        address,
        gender,
        bvn,
        beneficiary_account,
        email
      };
      if (middleName && middleName.trim() !== '') {
        squadPayload.middle_name = middleName;
      }

      const squadData = await createSquadVirtualAccount(squadPayload);
      if (!squadData || !squadData.data) {
        return res.status(500).json({ message: 'Failed to create Squad virtual account', error: squadData });
      }
      savedAccount = await db.VirtualAccount.create({
        userId: user.id,
        accountNumber: squadData.data.virtual_account_number,
        bankName: squadData.data.bank_code,
        bankId: squadData.data.bank_code,
        accountName: `${squadData.data.first_name} ${squadData.data.last_name}`,
        raw: squadData,
        provider: 'squad'
      });
      await db.Wallet.update(
        {
          accountNumber: savedAccount.accountNumber,
          bankName: savedAccount.bankName,
          accountName: savedAccount.accountName
        },
        { where: { userId: user.id } }
      );
    } else {
      return res.status(400).json({ message: 'Invalid provider' });
    }

    // Notify user about virtual account creation (optional template)
    await sendNotification(
      user,
      '',
      'Virtual Account Created',
      null,
      'virtualAccountCreated',
      {
        accountNumber: savedAccount.accountNumber,
        bankName: savedAccount.bankName,
        accountName: savedAccount.accountName
      }
    );

    res.status(200).json({ message: 'Virtual account created', account: savedAccount });
  } catch (err) {
    console.error('Create virtual account error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to create virtual account', error: err.response?.data || err.message });
  }
};

exports.getSupportedDedicatedBanks = async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/bank?type=dedicated_account', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });
    res.status(200).json({ banks: response.data.data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dedicated banks', error: err.response?.data || err.message });
  }
};

// 🔒 Set Transaction PIN
exports.setTransactionPin = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { pin } = req.body;
  if (!pin || pin.length < 4) {
    return res.status(400).json({ message: 'PIN must be at least 4 digits' });
  }
  try {
    const hashedPin = await bcrypt.hash(pin, 10);
    await db.User.update(
      { transactionPin: hashedPin },
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Transaction PIN set successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to set PIN', error: err.message });
  }
};

// 📄 Get Transaction by Reference
exports.getTransactionByReference = async (req, res) => {
  const { reference } = req.params;
  if (!reference) {
    return res.status(400).json({ message: 'Reference is required' });
  }
  try {
    const transaction = await db.Transaction.findOne({ where: { reference }, raw: true });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transaction', error: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await db.Transaction.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.status(200).json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// 👤 Get User by Account Number (for recipient verification)
exports.getUserByAccountNumber = async (req, res) => {
  const { accountNumber } = req.params;
  if (!accountNumber) {
    return res.status(400).json({ message: 'Account number is required' });
  }
  try {
    const wallet = await db.Wallet.findOne({ where: { accountNumber } });
    if (!wallet) {
      return res.status(404).json({ message: 'Account not found' });
    }
    const user = await db.User.findOne({ where: { id: wallet.userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      accountNumber: wallet.accountNumber,
      accountName: wallet.accountName || user.fullName || user.name || user.email,
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};