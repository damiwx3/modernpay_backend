
const express = require('express');
const router = express.Router();
const controller = require('../controllers/contribution.controller');
const auth = require('../middleware/auth.middleware');
const multer = require('multer');

// Setup Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/groups');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Contributions
 *   description: Group contribution endpoints
 */

// ✅ Create a new contribution group
router.post('/groups', auth, upload.single('image'), controller.createGroup);

// ✅ Join a group (using groupId in URL)
router.post('/groups/:groupId/join', auth, controller.joinGroup);

// ✅ Get all groups the user is in
router.get('/groups', auth, controller.getUserGroups);

// ✅ Get group details
router.get('/groups/:id', auth, controller.getGroupDetails);
router.post('/groups/:groupId/invite', auth, controller.inviteToGroup);
router.post('/groups/:groupId/leave', auth, controller.leaveGroup);
router.put('/groups/:groupId', auth, controller.updateGroup);
router.get('/payout-history', auth, controller.payoutHistory);
router.post('/scheduler/trigger', auth, controller.runScheduler);
router.post('/contacts', auth, controller.addContributionContact);

module.exports = router;
