var express = require('express');
var router = express.Router();
var clerkAuth = require('../services/clerkAuth');

router.use(clerkAuth.requireAdmin);

router.get('/', function (req, res) {
  res.render('admin/dashboard', {
    page: 'Admin Dashboard',
    menuId: '',
    currentUser: req.currentUser,
    currentUserEmail: clerkAuth.primaryEmail(req.currentUser)
  });
});

router.get('/admins', function (req, res, next) {
  clerkAuth.listAdmins().then(function (admins) {
    res.render('admin/admins', {
      page: 'Manage Admins',
      menuId: '',
      currentUser: req.currentUser,
      currentUserEmail: clerkAuth.primaryEmail(req.currentUser),
      admins: admins,
      invited: req.query.invited === '1',
      removed: req.query.removed === '1',
      error: req.query.error || null
    });
  }).catch(next);
});

router.post('/admins/invite', function (req, res, next) {
  var email = (req.body.email || '').trim();
  if (!email) return res.redirect('/admin/admins?error=' + encodeURIComponent('Enter an email address.'));

  var redirectUrl = req.protocol + '://' + req.get('host') + '/post-auth';

  clerkAuth.inviteAdmin(email, redirectUrl).then(function () {
    res.redirect('/admin/admins?invited=1');
  }).catch(function (err) {
    res.redirect('/admin/admins?error=' + encodeURIComponent(err.message || 'Could not send invite.'));
  });
});

router.post('/admins/:userId/remove', function (req, res, next) {
  if (req.params.userId === req.currentUser.id) {
    return res.redirect('/admin/admins?error=' + encodeURIComponent("You can't remove your own admin access."));
  }

  clerkAuth.removeAdmin(req.params.userId).then(function () {
    res.redirect('/admin/admins?removed=1');
  }).catch(next);
});

module.exports = router;
