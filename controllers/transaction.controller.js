const db = require('../models');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const moment = require('moment');

// In transaction.controller.js
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

    res.status(200).json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// ✅ Create a manual transaction (for admin/testing/demo)
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, description, status } = req.body;

    if (!amount || !type || isNaN(amount)) {
      return res.status(400).json({ message: 'Amount (numeric) and type are required.' });
    }

    const txn = await db.Transaction.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: type.toLowerCase(), // debit or credit
      description: description || 'Manual transaction',
      status: status || 'pending', // Optional: pending, success, failed
    });

    res.status(201).json({ message: 'Transaction created successfully', txn });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};

// ✅ Export transactions as PDF or CSV
exports.exportTransactions = async (req, res) => {
  try {
    const { type = 'pdf', month, year } = req.query;
    const userId = req.user.id;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required.' });
    }

    const start = moment(`${year}-${month}-01`).startOf('month');
    const end = moment(start).endOf('month');

    const transactions = await db.Transaction.findAll({
      where: {
        userId,
        createdAt: { [db.Sequelize.Op.between]: [start.toDate(), end.toDate()] },
      },
      order: [['createdAt', 'DESC']]
    });

    if (type === 'csv') {
      const fields = ['type', 'amount', 'description', 'status', 'createdAt'];
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
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export transactions', error: err.message });
  }
};