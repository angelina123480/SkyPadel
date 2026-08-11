const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', accountController.dashboard);
router.get('/profile', accountController.showProfile);
router.post('/profile', accountController.updateProfile);
router.get('/settings', accountController.showSettings);
router.post('/settings/password', accountController.updatePassword);
router.post('/settings/notifications', accountController.updateNotifications);

module.exports = router;
