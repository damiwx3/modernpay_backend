const axios = require('axios');
const db = require('../models');

// Tier 1: Phone number and selfie verification (NGN 200,000 limit)
exports.verifyPhoneAndSelfie = async (req, res) => {
  const { phone, selfieImage, bvn } = req.body;
  if (!phone || !selfieImage || !bvn) {
    return res.status(400).json({ message: 'Phone, selfie image, and BVN are required' });
  }

  try {
    // 1. Phone verification (OTP)
    const phoneRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/phone',
      { phone },
      { headers: { token: process.env.YOUVERIFY_API_KEY } }
    );
    if (phoneRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Phone verification failed', details: phoneRes.data });
    }

    // 2. Selfie/Face match with BVN photo
    const selfieRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/face-match',
      {
        bvn,
        selfie_image: selfieImage // base64 string or file URL
      },
      { headers: { token: process.env.YOUVERIFY_API_KEY } }
    );
    if (selfieRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Selfie/Face match failed', details: selfieRes.data });
    }

    await db.User.update(
      { kycLevel: 1, kycStatus: 'tier1_verified' },
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Tier 1 unlocked (phone & selfie verified)', phone: phoneRes.data, selfie: selfieRes.data });
  } catch (err) {
    res.status(500).json({ message: 'Tier 1 KYC failed', error: err.response?.data || err.message });
  }
};

// Tier 2: NIN/BVN, ID, and address verification (NGN 5,000,000 limit)
exports.verifyBvnOrNinAndAddress = async (req, res) => {
  const { bvn, nin, address } = req.body;
  if (!bvn && !nin) {
    return res.status(400).json({ message: 'BVN or NIN is required' });
  }
  try {
    let verificationResult;
    if (bvn) {
      const response = await axios.post(
        'https://api.youverify.co/v2/api/identity/ng/bvn',
        { id: bvn },
        { headers: { token: process.env.YOUVERIFY_API_KEY } }
      );
      verificationResult = response.data;
      if (verificationResult.status !== 'success') {
        return res.status(400).json({ message: 'BVN verification failed', details: verificationResult });
      }
    } else if (nin) {
      const response = await axios.post(
        'https://api.youverify.co/v2/api/identity/ng/nin',
        { id: nin },
        { headers: { token: process.env.YOUVERIFY_API_KEY } }
      );
      verificationResult = response.data;
      if (verificationResult.status !== 'success') {
        return res.status(400).json({ message: 'NIN verification failed', details: verificationResult });
      }
    }

    // Optionally verify address if provided
    let addressResult = null;
    if (address) {
      const addrRes = await axios.post(
        'https://api.youverify.co/v2/api/identity/ng/address',
        { address },
        { headers: { token: process.env.YOUVERIFY_API_KEY } }
      );
      addressResult = addrRes.data;
      if (addressResult.status !== 'success') {
        return res.status(400).json({ message: 'Address verification failed', details: addressResult });
      }
    }

    await db.User.update(
      { kycLevel: 2, kycStatus: 'tier2_verified' },
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Tier 2 unlocked (NIN/BVN, ID, address verified)', verification: verificationResult, address: addressResult });
  } catch (err) {
    res.status(500).json({ message: 'Tier 2 KYC failed', error: err.response?.data || err.message });
  }
};

// Tier 3: Address or Selfie Verification (Unlimited)
exports.verifyAddressOrSelfie = async (req, res) => {
  const { address, selfieImage, bvn } = req.body;
  if (!address && !(selfieImage && bvn)) {
    return res.status(400).json({ message: 'Address or (selfie & BVN) required' });
  }
  try {
    let addressResult = null, selfieResult = null;
    if (address) {
      const addrRes = await axios.post(
        'https://api.youverify.co/v2/api/identity/ng/address',
        { address },
        { headers: { token: process.env.YOUVERIFY_API_KEY } }
      );
      addressResult = addrRes.data;
      if (addressResult.status !== 'success') {
        return res.status(400).json({ message: 'Address verification failed', details: addressResult });
      }
    }
    if (selfieImage && bvn) {
      const selfieRes = await axios.post(
        'https://api.youverify.co/v2/api/identity/ng/face-match',
        { bvn, selfie_image: selfieImage },
        { headers: { token: process.env.YOUVERIFY_API_KEY } }
      );
      selfieResult = selfieRes.data;
      if (selfieResult.status !== 'success') {
        return res.status(400).json({ message: 'Selfie/Face match failed', details: selfieResult });
      }
    }

    await db.User.update(
      { kycLevel: 3, kycStatus: 'tier3_verified' },
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Tier 3 unlocked (address or selfie verified)', address: addressResult, selfie: selfieResult });
  } catch (err) {
    res.status(500).json({ message: 'Tier 3 KYC failed', error: err.response?.data || err.message });
  }
};

// Tier 4: Utility bill verification (Unlimited)
exports.verifyUtilityBill = async (req, res) => {
  const { utilityBillImage, address } = req.body;
  if (!utilityBillImage || !address) {
    return res.status(400).json({ message: 'Utility bill image and address required' });
  }
  try {
    // Utility bill verification
    const utilRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/utility-bill',
      { address, utility_bill_image: utilityBillImage },
      { headers: { token: process.env.YOUVERIFY_API_KEY } }
    );
    if (utilRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Utility bill verification failed', details: utilRes.data });
    }

    await db.User.update(
      { kycLevel: 4, kycStatus: 'tier4_verified' },
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Tier 4 unlocked (utility bill verified)', utilityBill: utilRes.data });
  } catch (err) {
    res.status(500).json({ message: 'Tier 4 KYC failed', error: err.response?.data || err.message });
  }
};

// Upload KYC Document (optional, for your own storage)
exports.uploadKycDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No document uploaded' });
  }
  // Save file info to DB or process as needed
  res.status(201).json({ message: 'KYC document uploaded successfully', file: req.file });
};

exports.getKycStatus = async (req, res) => {
  const user = await db.User.findByPk(req.user.id, {
    attributes: ['kycLevel', 'kycStatus']
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json({
    kycLevel: user.kycLevel,
    kycStatus: user.kycStatus
  });
};
