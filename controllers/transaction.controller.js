const db = require('../models');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const moment = require('moment');

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = { userId: req.user.id };

    if (month && year) {
      const start = new Date(`${year}-${month}-01`);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      where.createdAt = { [db.Sequelize.Op.between]: [start, end] };
    }

    const transactions = await db.Transaction.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ data: transactions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// Create a manual transaction (for admin/testing/demo)
exports.createTransaction = async (req, res) => {
  try {
    const {
      amount,
      type,
      description,
      status,
      category,
      senderName,
      recipientName,
      recipientAccount
    } = req.body;

    if (!amount || !type || isNaN(amount)) {
      return res.status(400).json({ message: 'Amount (numeric) and type are required.' });
    }

    // Use senderName from body, or fallback to user's name, or "You"
    const resolvedSenderName = senderName || req.user.name || 'You';

    const txn = await db.Transaction.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: type.toLowerCase(),
      description: description || 'Manual transaction',
      status: status || 'pending',
      category: category || null,
      senderName: resolvedSenderName,
      recipientName: recipientName || null,
      recipientAccount: recipientAccount || null,
    });

    res.status(201).json({ message: 'Transaction created successfully', txn });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};


// Export transactions as PDF or CSV
exports.exportTransactions = async (req, res) => {
  try {
    const { type = 'pdf', month, year } = req.query;
    const userId = req.user.id;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required.' });
    }

    const paddedMonth = String(month).padStart(2, '0');
    const start = moment(`${year}-${paddedMonth}-01`).startOf('month');
    const end = moment(start).endOf('month');

    const transactions = await db.Transaction.findAll({
      where: {
        userId,
        createdAt: { [db.Sequelize.Op.between]: [start.toDate(), end.toDate()] },
      },
      order: [['createdAt', 'DESC']]
    });

    // CSV Export
    if (type === 'csv') {
      const fields = [
        'type',
        'amount',
        'description',
        'category',
        'status',
        'createdAt',
        'senderName',
        'recipientName',
        'recipientAccount'
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(transactions.map(t => t.toJSON()));
      res.header('Content-Type', 'text/csv');
      res.attachment(`transactions_${month}_${year}.csv`);
      return res.send(csv);
    }

    // PDF Export
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${month}_${year}.pdf`);
    doc.pipe(res);
    doc.fontSize(18).text('ModernPay Transactions', { align: 'center' });
    doc.moveDown();

    transactions.forEach(txn => {
      doc.fontSize(12).text(
        `${txn.createdAt.toISOString().slice(0, 10)} - ${txn.type.toUpperCase()} - ₦${txn.amount} - ${txn.description}`
      );
      doc.fontSize(11).text(
        `Sender: ${txn.senderName || 'You'} (ModernPay)`
      );
      doc.fontSize(11).text(
        `Recipient: ${txn.recipientName || ''} (${txn.recipientAccount || ''})`
      );
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export transactions', error: err.message });
  }
};