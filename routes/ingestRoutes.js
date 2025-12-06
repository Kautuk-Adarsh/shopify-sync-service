const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');

router.post('/products', ingestController.syncProducts);
router.post('/customers', ingestController.syncCustomers);
router.post('/orders', ingestController.syncOrders)
module.exports = router;