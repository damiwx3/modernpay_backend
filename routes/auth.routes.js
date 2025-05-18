const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const securityLogger = require('../middleware/securityLogger');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & OTP routes
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: MySecurePassword123
 *               phone:
 *                 type: string
 *                 example: "+2348123456789"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already registered
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
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
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: MySecurePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post('/login', securityLogger, authController.login);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify user OTP after registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               code:
 *                 type: string
 *                 example: "593021"
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
router.post('/verify-otp', authController.verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP resent
 *       404:
 *         description: User not found
 */
router.post('/resend-otp', authController.resendOtp);

console.log("✅ Auth routes loaded");

module.exports = router;
