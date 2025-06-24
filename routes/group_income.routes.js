const express = require('express');
const router = express.Router();
const groupIncomeController = require('../controllers/group_income.controller');
const groupAuth = require('../middleware/groupAuth');

router.get('/group-income/:groupId', groupAuth, groupIncomeController.getGroupIncome);

module.exports = router;