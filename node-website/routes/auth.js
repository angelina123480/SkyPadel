var express = require('express');
var router = express.Router();
var clerkAuth = require('../services/clerkAuth');

function notConfigured(res) {
  return res.status(503).render('auth/not-configured', { page: 'Sign In', menuId: '' });
}

// Clerk's <SignIn/> component handles its own sub-steps (verify, forgot
// password, etc.) client-side, so every /sign-in/* path renders the same page.
router.get(['/sign-in', '/sign-in*'], function (req, res) {
  if (!clerkAuth.isConfigured) return notConfigured(res);
  res.render('auth/sign-in', { page: 'Sign In', menuId: '' });
});

router.get(['/sign-up', '/sign-up*'], function (req, res) {
  if (!clerkAuth.isConfigured) return notConfigured(res);
  res.render('auth/sign-up', { page: 'Sign Up', menuId: '' });
});

// Landing spot after a successful sign-in/up — routes admins vs clients
// to the right place.
router.get('/post-auth', function (req, res, next) {
  if (!clerkAuth.isConfigured) return notConfigured(res);

  clerkAuth.getCurrentUser(req).then(function (user) {
    if (!user) return res.redirect('/sign-in');
    res.redirect(clerkAuth.isAdminUser(user) ? '/admin' : '/account');
  }).catch(next);
});

module.exports = router;
