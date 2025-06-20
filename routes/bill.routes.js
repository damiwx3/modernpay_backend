const express = require('express');
const router = express.Router();
const controller = require('../controllers/bill.controller');
const billController = require('../controllers/bill.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: Bill payment endpoints
 */

/**
 * @swagger
 * /api/bills/categories:
 *   get:
 *     summary: List all available bill categories (Airtime, Data, etc.)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', auth, controller.getCategories);

/**
 * @swagger
 * /api/bills/categories/airtime:
 *   get:
 *     summary: List Nigerian airtime categories (MTN, GLO, Airtel, 9mobile)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Nigerian airtime categories
 */
router.get('/categories/airtime', auth, controller.getAirtimeCategories);

/**
 * @swagger
 * /api/bills/categories/data:
 *   get:
 *     summary: List Nigerian data categories (MTN, GLO, Airtel, 9mobile)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Nigerian data categories
 */
router.get('/categories/data', auth, controller.getDataCategories);

/**
 * @swagger
 * /api/bills/validate:
 *   post:
 *     summary: Validate a customer before bill payment (e.g., meter or smartcard)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceType, customer]
 *             properties:
 *               serviceType:
 *                 type: string
 *               customer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation successful
 *       400:
 *         description: Invalid data
 */
router.post('/validate', auth, controller.validateCustomer);

/**
 * @swagger
 * /api/bills/pay:
 *   post:
 *     summary: Pay for a bill via VTPass
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceType, amount, customer]
 *             properties:
 *               serviceType:
 *                 type: string
 *                 example: AIRTIME
 *               amount:
 *                 type: number
 *                 example: 100
 *               customer:
 *                 type: string
 *                 example: "08012345678"
 *     responses:
 *       201:
 *         description: Bill paid successfully
 */
router.post('/pay', auth, controller.payBill);

/**
 * @swagger
 * /api/bills/history:
 *   get:
 *     summary: Get user bill payment history
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's past bill payments
 */
router.get('/history', auth, controller.getHistory);

/**
 * @swagger
 * /api/bills/bundles/{serviceID}:
 *   get:
 *     summary: Get available bundles for a biller (e.g., data or TV)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: serviceID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID (e.g., mtn-data)
 *     responses:
 *       200:
 *         description: Returns list of available bundles
 */
router.get('/bundles/:serviceID', auth, controller.getBundles);

router.post('/mtn-vtu', billController.purchaseMtnVtu);
router.post('/vtu-status', billController.queryVtuStatus);
router.get('/services-by-category', billController.getServicesByCategory);

module.exports = router;