const axios = require('axios');
const db = require('../models');

// Tier 1: Phone + Selfie + BVN (Face Match)
exports.verifyPhoneSelfieBvn = async (req, res) => {
  console.log('KYC endpoint hit', req.body); 
  const { phone, selfieImage, bvn } = req.body;
  if (!phone || !selfieImage || !bvn) {
    return res.status(400).json({ message: 'Phone, selfie image, and BVN are required' });
  }
  try {
    // 1. Phone verification (Youverify expects "mobile" and "isSubjectConsent")
    const phoneRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/phone',
      { mobile: phone, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    if (phoneRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Phone verification failed', details: phoneRes.data });
    }
    // 2. Face match with BVN
    const selfieRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/face-match',
      { bvn, selfie_image: selfieImage },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    if (selfieRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Selfie/Face match failed', details: selfieRes.data });
    }
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
      { kycLevel: 1, kycStatus: 'tier1_verified', kycLimit: 500000 }, // Set Tier 1 limit
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Tier 1 unlocked (phone, selfie, BVN verified)', phone: phoneRes.data, selfie: selfieRes.data });
  } catch (err) {
    console.error('Tier 1 KYC failed:', err.response?.data || err.message);
    res.status(500).json({ message: 'Tier 1 KYC failed', error: err.response?.data || err.message });
  }
};

// Tier 2: NIN card, National ID card, Driver’s License, Passport, or PVC
exports.verifyAnyGovernmentId = async (req, res) => {
  const { nin, driversLicense, passport, pvc } = req.body;
  if (!nin && !driversLicense && !passport && !pvc) {
    return res.status(400).json({ message: 'Provide NIN, Driver’s License, Passport, or PVC' });
  }
  let url, payload, docType, docNumber;
  if (nin) {
    url = 'https://api.youverify.co/v2/api/identity/ng/nin';
    payload = { id: nin, isSubjectConsent: true };
    docType = 'nin'; docNumber = nin;
  } else if (driversLicense) {
    url = 'https://api.youverify.co/v2/api/identity/ng/drivers-license';
    payload = { id: driversLicense, isSubjectConsent: true };
    docType = 'drivers_license'; docNumber = driversLicense;
  } else if (passport) {
    url = 'https://api.youverify.co/v2/api/identity/ng/passport';
    payload = { id: passport, isSubjectConsent: true };
    docType = 'passport'; docNumber = passport;
  } else if (pvc) {
    url = 'https://api.youverify.co/v2/api/identity/ng/pvc';
    payload = { id: pvc, isSubjectConsent: true };
    docType = 'pvc'; docNumber = pvc;
  }
  try {
    const response = await axios.post(url, payload, { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } });
    if (response.data.status !== 'success') {
      return res.status(400).json({ message: 'ID verification failed', details: response.data });
    }
    await db.KYCDocument.create({
      userId: req.user.id,
      documentType: docType,
      documentNumber: docNumber,
      status: 'approved',
      submittedAt: new Date(),
      externalReferenceId: response.data.data?.reference || null,
      kycApiResponse: response.data,
    });
    await db.User.update(
      { kycLevel: 2, kycStatus: 'tier2_verified', kycLimit: 10000000 }, // Set Tier 2 limit
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Tier 2 unlocked (ID verified)', verification: response.data });
  } catch (err) {
    console.error('Tier 2 KYC failed:', err.response?.data || err.message);
    res.status(500).json({ message: 'Tier 2 KYC failed', error: err.response?.data || err.message });
  }
};

// Tier 3: Address & Utility Bill
exports.verifyAddressAndUtilityBill = async (req, res) => {
  const { address, utilityBillImage } = req.body;
  if (!address || !utilityBillImage) {
    return res.status(400).json({ message: 'Address and utility bill image are required' });
  }
  try {
    // 1. Address verification
    const addrRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/address',
      { address },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    if (addrRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Address verification failed', details: addrRes.data });
    }
    // 2. Utility bill verification
    const utilRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/utility-bill',
      { address, utility_bill_image: utilityBillImage },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    if (utilRes.data.status !== 'success') {
      return res.status(400).json({ message: 'Utility bill verification failed', details: utilRes.data });
    }
    // Save both as KYC documents
    await db.KYCDocument.create({
      userId: req.user.id,
      documentType: 'address',
      documentNumber: null,
      documentUrl: null,
      status: 'approved',
      submittedAt: new Date(),
      externalReferenceId: addrRes.data.data?.reference || null,
      kycApiResponse: addrRes.data,
    });
    await db.KYCDocument.create({
      userId: req.user.id,
      documentType: 'utility_bill',
      documentNumber: null,
      documentUrl: utilityBillImage,
      status: 'approved',
      submittedAt: new Date(),
      externalReferenceId: utilRes.data.data?.reference || null,
      kycApiResponse: utilRes.data,
    });
    await db.User.update(
      { kycLevel: 3, kycStatus: 'tier3_verified', kycLimit: null }, // Set Tier 3 limit (unlimited)
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Tier 3 unlocked (address & utility bill verified)', address: addrRes.data, utilityBill: utilRes.data });
  } catch (err) {
    console.error('Tier 3 KYC failed:', err.response?.data || err.message);
    res.status(500).json({ message: 'Tier 3 KYC failed', error: err.response?.data || err.message });
  }
};

// Get KYC status
exports.getKycStatus = async (req, res) => {
  const user = await db.User.findByPk(req.user.id, {
    attributes: ['kycLevel', 'kycStatus', 'kycLimit']
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json({
    kycLevel: user.kycLevel,
    kycStatus: user.kycStatus,
    kycLimit: user.kycLimit
  });
};
