
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getStats);
router.get('/chart', dashboardController.getSalesOverTime);
router.get('/top-customers', dashboardController.getTopCustomers);

module.exports = router;