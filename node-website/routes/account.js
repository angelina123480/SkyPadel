var express = require('express');
var router = express.Router();
var clerkAuth = require('../services/clerkAuth');

router.use(clerkAuth.requireSignedIn);

router.get('/', function (req, res) {
  res.render('account/index', {
    page: 'My Account',
    menuId: 'account',
    currentUser: req.currentUser,
    isAdmin: clerkAuth.isAdminUser(req.currentUser)
  });
});

module.exports = router;
