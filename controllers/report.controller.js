const db = require('../models');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const { Parser } = require('json2csv');

// PDF monthly statement
exports.generateMonthlyStatement = async (req, res) => {
  try {
    const user = req.user;
    const transactions = await db.Transaction.findAll({
      where: {
        userId: user.id,
        createdAt: {
          [db.Sequelize.Op.gte]: moment().startOf('month').toDate(),
          [db.Sequelize.Op.lte]: moment().endOf('month').toDate(),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename="monthly_statement.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Add user/account info to the header
    doc.fontSize(18).text(`Monthly Statement - ${moment().format('MMMM YYYY')}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${user.fullName || ''}`);
    doc.text(`Email: ${user.email || ''}`);
    doc.text(`Account ID: ${user.id}`);
    doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    doc.moveDown();

    transactions.forEach(txn => {
      doc.fontSize(12).text(`• ${txn.type.toUpperCase()} ₦${txn.amount} - ${txn.description} (${moment(txn.createdAt).format('DD MMM')})`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate statement', error: err.message });
  }
};

// Export transactions as CSV
exports.exportCSV = async (req, res) => {
  try {
    const transactions = await db.Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    const plain = transactions.map(txn => ({
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      date: moment(txn.createdAt).format('YYYY-MM-DD HH:mm:ss')
    }));

    const parser = new Parser();
    const csv = parser.parse(plain);

    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.set('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export CSV', error: err.message });
  }
};