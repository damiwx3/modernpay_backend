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

// Tier 3: Upload KYC Document (ID card, etc.)
router.post('/upload', auth, upload.single('document'), kycController.uploadKycDocument);

// Tier 2: Verify BVN
router.post('/verify-bvn', auth, kycController.verifyBvn);

// Tier 4: Address or Selfie Verification
router.post('/verify-address-or-selfie', auth, kycController.verifyAddressOrSelfie);

// Get KYC Status and documents
router.get('/status', auth, kycController.getKycStatus);

module.exports = router;