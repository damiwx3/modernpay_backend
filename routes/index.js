const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/wallets', require('./wallet.routes'));
router.use('/kyc', require('./kyc.routes'));
router.use('/loans', require('./loan.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/admin-auth', require('./admin_auth.routes'));
router.use('/admin-dashboard', require('./admin_dashboard.routes'));
router.use('/referrals', require('./referral.routes'));
router.use('/bills', require('./bill.routes'));
router.use('/savings', require('./savings.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/notify', require('./notify.routes'));
router.use('/system', require('./system.routes'));
router.use('/webhooks', require('./webhook.routes'));
router.use('/contributions', require('./contribution.routes')); // Contribution groups & members
router.use('/contribution-cycles', require('./contribution_cycle.routes')); // Contribution cycles
router.use('/virtual-cards', require('./virtual_card.routes'));
router.use('/campaigns', require('./campaign.routes'));
router.use('/tickets', require('./ticket.routes'));
router.use('/disputes', require('./dispute.routes'));
router.use('/reports', require('./report.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/settings', require('./setting.routes'));
router.use('/contacts', require('./user_contact.routes'));
router.use('/admin-kyc', require('./admin_kyc.routes'));
router.use('/security', require('./security.routes'));
router.use('/notifications', require('./notification.routes'));

module.exports = router;