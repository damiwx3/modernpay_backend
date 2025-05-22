const db = require('../models');
const axios = require('axios');

// Tier 2: Verify BVN with Flutterwave and upgrade KYC level
exports.verifyBvn = async (req, res) => {
  const { bvn } = req.body;
  if (!bvn) {
    return res.status(400).json({ message: 'BVN is required' });
  }

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/kyc/bvns/${bvn}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status === 'success') {
      // Upgrade user to Tier 2
      await db.User.update(
        { kycLevel: 2, bvn },
        { where: { id: req.user.id } }
      );
      return res.status(200).json({
        message: 'BVN verified, Tier 2 unlocked',
        data: response.data.data,
      });
    } else {
      return res.status(400).json({ message: 'BVN verification failed', details: response.data.message });
    }
  } catch (err) {
    return res.status(500).json({ message: 'BVN verification error', error: err.message });
  }
};

// Tier 3: Upload KYC Document (ID card, etc.) and upgrade KYC level
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

    // Optionally, auto-upgrade to Tier 3 (or after manual review)
    await db.User.update(
      { kycLevel: 3 },
      { where: { id: req.user.id } }
    );

    res.status(201).json({ message: 'KYC document submitted, Tier 3 unlocked (pending review)', document });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload KYC document' });
  }
};

// Tier 4: Address verification or selfie (example, you can expand as needed)
exports.verifyAddressOrSelfie = async (req, res) => {
  // Implement your address verification or selfie logic here
  // After successful verification:
  await db.User.update(
    { kycLevel: 4 },
    { where: { id: req.user.id } }
  );
  res.status(200).json({ message: 'Tier 4 unlocked (address/selfie verified)' });
};

// Get KYC Status and documents
exports.getKycStatus = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    const docs = await db.KYCDocument.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      kycLevel: user.kycLevel,
      status: docs[0]?.status || 'unverified',
      documents: docs
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get KYC status' });
  }
};