const express = require('express');
const router = express.Router();
const controller = require('../controllers/contribution_cycle.controller');
const auth = require('../middleware/auth.middleware');

// Get all cycles for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const cycles = await require('../models').ContributionCycle.findAll({ where: { groupId } });
    res.json({ cycles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all cycles (optionally filtered)
router.get('/', auth, controller.getAllCycles);

// Get cycle by ID
router.get('/:id', auth, controller.getCycleById);

// Create a new contribution cycle
router.post('/', auth, controller.createCycle);

// Make a contribution payment
router.post('/:id/contribute', auth, controller.makeContribution);

// Get the full payout order for a cycle
router.get('/:id/payout-order', auth, controller.getPayoutOrder);

// User spins for their payout order in a cycle
router.post('/:id/spin', auth, controller.spinForOrder);

// Close a cycle and trigger payout
router.post('/:id/close', auth, controller.closeCycle);

// Get all payments for a cycle
router.get('/:id/payments', auth, controller.getCyclePayments);

module.exports = router;