const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

/**
 * @swagger
 * tags:
 *   name: KYC
 *   description: Know Your Customer identity verification
 */

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
 *               documentType:
 *                 type: string
 *               documentFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: KYC uploaded successfully
 *       400:
 *         description: Invalid or missing data
 */


router.post('/upload', auth, upload.single('document'), kycController.uploadKycDocument);
router.get('/status', auth, kycController.getKycStatus);

module.exports = router;
