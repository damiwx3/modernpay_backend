const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // Multer middleware for file uploads

/**
 * @swagger
 * /api/kyc/upload:
 *   post:
 *     summary: Upload KYC documents
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: KYC document uploaded successfully
 *       400:
 *         description: Invalid or missing data
 */

// Tier 1: Phone number and selfie verification (NGN 200,000 limit)
router.post('/verify-phone-selfie', auth, kycController.verifyPhoneAndSelfie);

// Tier 2: NIN/BVN, ID, and address verification (NGN 5,000,000 limit)
router.post('/verify-bvn-or-nin-address', auth, kycController.verifyBvnOrNinAndAddress);

// Tier 3: Address or Selfie Verification (Unlimited)
router.post('/verify-address-or-selfie', auth, kycController.verifyAddressOrSelfie);

// Tier 3: Upload KYC Document (ID card, etc.)
router.post('/upload', auth, upload.single('document'), kycController.uploadKycDocument);

// Get KYC Status and documents
router.get('/status', auth, kycController.getKycStatus);

module.exports = router;
