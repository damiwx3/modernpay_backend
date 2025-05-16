const db = require('../models');

exports.uploadKycDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await db.KYCDocument.create({
      userId: req.user.id,
      type: req.body.type || 'ID card',
      documentUrl: req.file.filename,
      status: 'pending',
      submittedAt: new Date()
    });

    res.status(201).json({ message: 'KYC document submitted', document });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload KYC document' });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    const docs = await db.KYCDocument.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ status: docs[0]?.status || 'unverified', documents: docs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get KYC status' });
  }
};
