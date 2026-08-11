const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, checkoutController.showCheckout);
router.post('/', requireAuth, checkoutController.placeOrder);

module.exports = router;
