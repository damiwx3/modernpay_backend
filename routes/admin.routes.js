const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminAuth = require('../middleware/admin_auth.middleware');


/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin user and settings management
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/user/:id', adminAuth, adminController.getUserById);
router.put('/user/:id', adminAuth, adminController.updateUser);
router.delete('/user/:id', adminAuth, adminController.deleteUser);

/**
 * @swagger
 * /api/admin/kyc/approve:
 *   post:
 *     summary: Approve a user's KYC
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: KYC approved
 *       404:
 *         description: User not found
 */
router.post('/kyc/approve', adminAuth, adminController.approveKyc);

/**
 * @swagger
 * /api/admin/summary:
 *   get:
 *     summary: Admin dashboard summary
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats summary
 */
router.get('/summary', adminAuth, adminController.getAdminSummary);

/**
 * @swagger
 * /api/admin/wallet/block:
 *   post:
 *     summary: Block a user's wallet
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Wallet blocked
 *       404:
 *         description: Wallet not found
 */
router.post('/wallet/block', adminAuth, adminController.blockWallet);


module.exports = router;
