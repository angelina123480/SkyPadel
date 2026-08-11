const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, orderController.listOrders);
router.get('/:id', requireAuth, orderController.showOrder);

module.exports = router;
