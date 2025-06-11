const axios = require('axios');
const db = require('../models');
const axios = require('axios');
const cloudinary = require('../utils/cloudinary');

// Tier 1: Phone, Selfie & BVN (Face Match)
exports.verifyPhoneSelfieBvn = async (req, res) => {
  try {
    const { phone, bvn } = req.body;
    if (!phone || !req.file || !bvn) {
      return res.status(400).json({ message: 'Phone, selfie image, and BVN are required' });
    }

    // 1. Upload selfie to Cloudinary
    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: 'kyc_selfies' },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: 'Cloudinary upload failed', error });
        }

        // 2. Phone verification
        const phoneRes = await axios.post(
          'https://api.youverify.co/v2/api/identity/ng/phone',
          { mobile: phone, isSubjectConsent: true },
          { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
        );
        if (phoneRes.data.message !== 'success') {
          return res.status(400).json({ message: 'Phone verification failed', details: phoneRes.data });
        }

        // 3. BVN verification
        const bvnRes = await axios.post(
          'https://api.youverify.co/v2/api/identity/ng/bvn',
          { id: bvn, isSubjectConsent: true },
          { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
        );
        if (bvnRes.data.message !== 'success') {
          return res.status(400).json({ message: 'BVN verification failed', details: bvnRes.data });
        }

        // 4. Face match (using Cloudinary URL)
        const selfieRes = await axios.post(
          'https://api.youverify.co/v2/api/identity/ng/face-match',
          { bvn, selfie_image: result.secure_url },
          { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
        );
        if (selfieRes.data.status !== 'success') {
          return res.status(400).json({ message: 'Selfie/Face match failed', details: selfieRes.data });
        }

        // Save to DB
        await db.KYCDocument.create({
          userId: req.user.id,
          documentType: 'selfie',
          documentNumber: bvn,
          selfieUrl: result.secure_url,
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
      }
    );
    // Pipe the file buffer to Cloudinary
    uploadResult.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ message: 'Tier 1 KYC failed', error: err.response?.data || err.message });
  }
};
// Tier 5: Utility Bill Verification
exports.verifyUtilityBill = async (req, res) => {
  const { document, documentType } = req.body;
  if (!document || !documentType) {
    return res.status(400).json({ message: 'Utility bill document and type are required' });
  }
  try {
    console.log('About to call Youverify utility bill API');
    const billRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/utility-bill',
      { document, documentType, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    console.log('Utility bill API response:', billRes.data);
    if (billRes.data.status !== 'success') {
      console.log('Utility bill verification failed');
      return res.status(400).json({ message: 'Utility bill verification failed', details: billRes.data });
    }
    // Save to DB or update user as needed
    console.log('Tier 5 KYC completed successfully');
    res.status(200).json({ message: 'Tier 5 unlocked (utility bill verified)', bill: billRes.data });
  } catch (err) {
    console.error('Tier 5 KYC failed:', err.response?.data || err.message, err.stack);
    res.status(500).json({ message: 'Tier 5 KYC failed', error: err.response?.data || err.message });
  }
};

// KYC Status (not implemented)
exports.getKycStatus = async (req, res) => {
  res.status(200).json({ message: 'KYC status endpoint not yet implemented.' });
};
