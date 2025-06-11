const axios = require('axios');
const db = require('../models');

exports.verifyPhoneSelfieBvn = async (req, res) => {
  console.log('KYC endpoint hit', req.body);
  const { phone, selfieImage, bvn } = req.body;
  if (!phone || !selfieImage || !bvn) {
    return res.status(400).json({ message: 'Phone, selfie image, and BVN are required' });
  }
  try {
    // 1. Phone verification
    console.log('Calling Youverify phone API');
    const phoneRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/phone',
      { mobile: phone, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    console.log('Phone API response:', phoneRes.data);
    if (phoneRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Phone verification failed', details: phoneRes.data });
    }

    // 2. BVN verification
    console.log('Calling Youverify BVN API');
    const bvnRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/bvn',
      { id: bvn, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    console.log('BVN API response:', bvnRes.data);
    if (bvnRes.data.status !== 'success') {
      return res.status(400).json({ message: 'BVN verification failed', details: bvnRes.data });
    }

    // 3. Face match
    console.log('Calling Youverify face-match API');
    const selfieRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/face-match',
      { bvn, selfie_image: selfieImage },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    console.log('Face-match API response:', selfieRes.data);
    if (selfieRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Selfie/Face match failed', details: selfieRes.data });
    }

    // Save to DB
    await db.KYCDocument.create({
      userId: req.user.id,
      documentType: 'selfie',
      documentNumber: bvn,
      selfieUrl: selfieImage,
      faceMatchScore: selfieRes.data.data?.score || null,
      status: 'approved',
      submittedAt: new Date(),
      externalReferenceId: selfieRes.data.data?.reference || null,
      kycApiResponse: selfieRes.data,
    });
    await db.User.update(
      { kycLevel: 1, kycStatus: 'tier1_verified', kycLimit: 500000 },
      { where: { id: req.user.id } }
    );
    res.status(200).json({
      message: 'Tier 1 unlocked (phone, selfie, BVN verified)',
      phone: phoneRes.data,
      bvn: bvnRes.data,
      selfie: selfieRes.data
    });
  } catch (err) {
    console.error('Tier 1 KYC failed:', err.response?.data || err.message, err.stack);
    res.status(500).json({ message: 'Tier 1 KYC failed', error: err.response?.data || err.message });
  }
};
// ...existing code...

// Tier 4: Government ID Verification
exports.verifyGovernmentId = async (req, res) => {
  const { idNumber, idType } = req.body;
  if (!idNumber || !idType) {
    return res.status(400).json({ message: 'ID number and ID type are required' });
  }
  try {
    console.log('Calling Youverify government ID API');
    const idRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/id',
      { id: idNumber, idType, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    console.log('Government ID API response:', idRes.data);
    if (idRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Government ID verification failed', details: idRes.data });
    }
    // Save to DB or update user as needed
    res.status(200).json({ message: 'Tier 4 unlocked (government ID verified)', id: idRes.data });
  } catch (err) {
    console.error('Tier 4 KYC failed:', err.response?.data || err.message, err.stack);
    res.status(500).json({ message: 'Tier 4 KYC failed', error: err.response?.data || err.message });
  }
};

// Tier 5: Utility Bill Verification
exports.verifyUtilityBill = async (req, res) => {
  const { document, documentType } = req.body;
  if (!document || !documentType) {
    return res.status(400).json({ message: 'Utility bill document and type are required' });
  }
  try {
    console.log('Calling Youverify utility bill API');
    const billRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/utility-bill',
      { document, documentType, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    console.log('Utility bill API response:', billRes.data);
    if (billRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Utility bill verification failed', details: billRes.data });
    }
    // Save to DB or update user as needed
    res.status(200).json({ message: 'Tier 5 unlocked (utility bill verified)', bill: billRes.data });
  } catch (err) {
    console.error('Tier 5 KYC failed:', err.response?.data || err.message, err.stack);
    res.status(500).json({ message: 'Tier 5 KYC failed', error: err.response?.data || err.message });
  }
};
// filepath: c:\Users\Dell\Documents\final bank\controllers\kyc.controller.js
exports.getKycStatus = async (req, res) => {
  res.status(200).json({ message: 'KYC status endpoint not yet implemented.' });
};
