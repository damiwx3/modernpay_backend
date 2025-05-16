const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin_auth.controller'); // ✅ CORRECT CONTROLLER

/**
 * @swagger
 * tags:
 *   name: AdminAuth
 *   description: Admin authentication routes
 */

/**
 * @swagger
 * /api/admin-auth/login:
 *   post:
 *     summary: Admin login with email and password (OTP sent)
 *     tags: [AdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/login', controller.login);

/**
 * @swagger
 * /api/admin-auth/verify-otp:
 *   post:
 *     summary: Verify OTP for admin login
 *     tags: [AdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - code
 *             properties:
 *               adminId:
 *                 type: integer
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/verify-otp', controller.verifyAdminOtp);

module.exports = router;
