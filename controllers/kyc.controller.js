const axios = require('axios');
const db = require('../models');
const cloudinary = require('../utils/cloudinary'); // If you use Cloudinary for image uploads

// Tier 1: Phone + Selfie + BVN (Face Match)
exports.verifyPhoneSelfieBvn = async (req, res) => {
  console.log('KYC endpoint hit', req.body);

  const { phone, bvn } = req.body;

  if (!phone || !bvn) {
    return res.status(400).json({ success: false, message: 'Phone and BVN are required' });
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

    if (!phoneRes.data.success || phoneRes.data.statusCode !== 200) {
      return res.status(400).json({ success: false, message: 'Phone verification failed', details: phoneRes.data });
    }

    // 2. BVN verification
    console.log('Calling Youverify BVN API');
    const bvnRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/bvn',
      { id: bvn, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    console.log('BVN API response:', bvnRes.data);

    const validBvnStatuses = ['success', 'found'];
    if (!validBvnStatuses.includes(bvnRes.data.data.status)) {
      return res.status(400).json({ success: false, message: 'BVN verification failed', details: bvnRes.data });
    }

    // Save KYC document (no selfie)
    await db.KYCDocument.create({
      userId: req.user.id,
      documentType: 'bvn',
      documentNumber: bvn,
      status: 'approved',
      submittedAt: new Date(),
      externalReferenceId: bvnRes.data.data?.id || null,
      kycApiResponse: bvnRes.data,
    });
    await db.User.update(
  { kycLevel: 1, kycStatus: 'approved', kycLimit: 500000 }, // <-- use 'approved'
  { where: { id: req.user.id } }
);
    res.status(200).json({
      success: true,
      message: 'Tier 1 unlocked (phone and BVN verified)',
      phone: phoneRes.data,
      bvn: bvnRes.data
    });
  } catch (err) {
    console.error('Tier 1 KYC failed:', err.response?.data || err.message, err.config?.url);
    res.status(500).json({ 
      success: false, 
      message: 'Tier 1 KYC failed', 
      error: err.response?.data || err.message,
      url: err.config?.url
    });
  }
};

// Tier 2: NIN card, National ID card, Driver’s License, Passport, or PVC
// Tier 2: NIN card, National ID card, Driver’s License, Passport, or PVC
exports.verifyAnyGovernmentId = async (req, res) => {
  const { nin, driversLicense, passport, pvc } = req.body;
  if (!nin && !driversLicense && !passport && !pvc) {
    return res.status(400).json({ success: false, message: 'Provide NIN, Driver’s License, Passport, or PVC' });
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
    const validStatuses = ['success', 'found', 'completed', 'approved'];
const status = response.data.status || response.data.data?.status;
if (!validStatuses.includes(status)) {
  return res.status(400).json({ success: false, message: 'ID verification failed', details: response.data });
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
      { kycLevel: 2, kycStatus: 'approved', kycLimit: 10000000 }, // <-- use valid ENUM value
      { where: { id: req.user.id } }
    );
    res.status(200).json({ success: true, message: 'Tier 2 unlocked (ID verified)', verification: response.data });
  } catch (err) {
    console.error('Tier 2 KYC failed:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Tier 2 KYC failed', error: err.response?.data || err.message });
  }
};

// Tier 3: Address & Utility Bill
// Tier 3: Address & Utility Bill
exports.verifyAddressAndUtilityBill = async (req, res) => {
  console.log('Received Tier 3 KYC:', req.body); // Add this line
  const { address, utilityBillImage } = req.body;
  if (!address || !utilityBillImage) {
    return res.status(400).json({ success: false, message: 'Address and utility bill image are required' });
  }
  try {
    // 1. Address verification
    const addrRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/verify-address', // <-- CORRECT
      { address, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    const validStatuses = ['success', 'found', 'completed', 'approved'];
    const addressStatus = addrRes.data.status || addrRes.data.data?.status;
    if (!validStatuses.includes(addressStatus)) {
      return res.status(400).json({ success: false, message: 'Address verification failed', details: addrRes.data });
    }
    // 2. Utility bill verification
    const utilRes = await axios.post(
      'https://api.youverify.co/v2/api/identity/ng/verify-utility-bill', // <-- CORRECT
      { address, utility_bill_image: utilityBillImage, isSubjectConsent: true },
      { headers: { token: process.env.YOUVERIFY_PUBLIC_KEY } }
    );
    const utilityStatus = utilRes.data.status || utilRes.data.data?.status;
    if (!validStatuses.includes(utilityStatus)) {
      return res.status(400).json({ success: false, message: 'Utility bill verification failed', details: utilRes.data });
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
      { kycLevel: 3, kycStatus: 'approved', kycLimit: 50000000 }, // <-- use valid ENUM value
      { where: { id: req.user.id } }
    );
    res.status(200).json({
      success: true,
      message: 'Tier 3 unlocked (address & utility bill verified)',
      address: addrRes.data,
      utilityBill: utilRes.data
    });
  } catch (err) {
    console.error('Tier 3 KYC failed:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Tier 3 KYC failed', error: err.response?.data || err.message });
  }
};
// Get KYC status
exports.getKycStatus = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: ['kycLevel', 'kycStatus', 'kycLimit']
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      kycLevel: user.kycLevel,
      kycStatus: user.kycStatus,
      kycLimit: user.kycLimit
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};