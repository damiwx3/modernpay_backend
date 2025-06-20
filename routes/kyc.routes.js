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

/**
 * @swagger
 * /api/kyc/status:
 *   get:
 *     summary: Get KYC status and documents
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns KYC status and level
 *       404:
 *         description: User not found
 */

// Tier 1: Phone + Selfie + BVN (Face Match)
router.post(
  '/verify-phone-selfie-bvn',
  auth,
  upload.single('selfieImage'), // <-- Add Multer here
  kycController.verifyPhoneSelfieBvn
);

// Tier 2: NIN, Driver’s License, Passport, or PVC
router.post('/verify-government-id', auth, kycController.verifyAnyGovernmentId);

// Tier 3: Address & Utility Bill
router.post('/verify-address-utility-bill', auth, kycController.verifyAddressAndUtilityBill);

// Upload KYC Document (optional/manual)
//router.post('/upload', auth, upload.single('document'), kycController.uploadKycDocument);

// Get KYC Status and documents
router.get('/status', auth, kycController.getKycStatus);

module.exports = router;