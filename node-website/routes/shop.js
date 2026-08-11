const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { requireAuth } = require('../middleware/auth');

router.get('/', shopController.list);
router.get('/:slug', shopController.show);
router.post('/:slug/reviews', requireAuth, shopController.addReview);

module.exports = router;
