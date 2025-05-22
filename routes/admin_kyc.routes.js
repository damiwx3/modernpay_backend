const express = require('express');
const router = express.Router();
const controller = require('../controllers/kyc_admin.controller');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: AdminKYC
 *   description: Admin KYC approval workflow
 */

router.get('/pending', adminAuth, controller.getPendingKyc);
router.post('/:kycId/approve', adminAuth, controller.approveKyc);
router.post('/:kycId/reject', adminAuth, controller.rejectKyc);

module.exports = router;
