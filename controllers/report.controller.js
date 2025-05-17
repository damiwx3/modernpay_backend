const db = require('../models');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Download CSV transactions
exports.downloadCsv = async (req, res) => {
  try {
    const transactions = await db.Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const jsonData = transactions.map(t => t.toJSON());
    const parser = new Parser();
    const csv = parser.parse(jsonData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export CSV', error: err.message });
  }
};

// Download PDF statement
exports.downloadPdf = async (req, res) => {
  try {
    const user = req.user;
    const transactions = await db.Transaction.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=statement.pdf');
    doc.pipe(res);

    doc.fontSize(18).text(`Account Statement - ${user.fullName}`, { align: 'center' });
    doc.moveDown();

    transactions.forEach(txn => {
      doc.fontSize(12).text(`Date: ${txn.createdAt}`);
      doc.text(`Type: ${txn.type}`);
      doc.text(`Amount: ₦${txn.amount}`);
      doc.text(`Description: ${txn.description}`);
      doc.text(`Status: ${txn.status}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
};