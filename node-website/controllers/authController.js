const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Cart = require('../models/Cart');
const PasswordReset = require('../models/PasswordReset');
const mailer = require('../services/mailer');
const { validateRegistration, validateLogin, required, minLength } = require('../middleware/validate');
const { bootstrapAdminIfNeeded } = require('../middleware/auth');

const REMEMBER_ME_MAX_AGE = 1000 * 60 * 60 * 24 * 30;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

function showRegister(req, res) {
  res.render('auth/register', { page: 'Create Account', menuId: '', errors: {}, values: {} });
}

async function register(req, res, next) {
  try {
    const errors = validateRegistration(req.body);
    if (!Object.keys(errors).length) {
      const existing = await User.findByEmail(req.body.email);
      if (existing) errors.email = 'An account with that email already exists.';
    }
    if (Object.keys(errors).length) {
      return res.status(400).render('auth/register', { page: 'Create Account', menuId: '', errors, values: req.body });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    let user = await User.create({
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      email: req.body.email.trim(),
      passwordHash
    });
    user = await bootstrapAdminIfNeeded(user);

    await establishSession(req, user, false);
    res.redirect(user.role === 'admin' ? '/admin' : '/account');
  } catch (err) {
    next(err);
  }
}

function showLogin(req, res) {
  res.render('auth/login', { page: 'Sign In', menuId: '', errors: {}, values: {}, redirectTo: req.query.redirect || '' });
}

async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    let user = null;
    if (!Object.keys(errors).length) {
      user = await User.findByEmail(req.body.email);
      const match = user && (await bcrypt.compare(req.body.password, user.password_hash));
      if (!match) errors.form = 'Incorrect email or password.';
    }
    if (Object.keys(errors).length) {
      return res.status(400).render('auth/login', {
        page: 'Sign In', menuId: '', errors, values: req.body, redirectTo: req.body.redirect || ''
      });
    }

    user = await bootstrapAdminIfNeeded(user);
    await establishSession(req, user, Boolean(req.body.rememberMe));

    const redirectTo = req.body.redirect || (user.role === 'admin' ? '/admin' : '/account');
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
}

function establishSession(req, user, rememberMe) {
  const guestCartId = req.session.cartId;
  return new Promise((resolve, reject) => {
    req.session.regenerate(async (err) => {
      if (err) return reject(err);
      try {
        req.session.userId = user.id;
        if (rememberMe) req.session.cookie.maxAge = REMEMBER_ME_MAX_AGE;
        const cart = await Cart.mergeGuestIntoUser(guestCartId, user.id);
        req.session.cartId = cart.id;
        req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
}

function showForgotPassword(req, res) {
  res.render('auth/forgot-password', { page: 'Forgot Password', menuId: '', sent: false, devResetUrl: null });
}

async function forgotPassword(req, res, next) {
  try {
    const user = required(req.body.email) ? await User.findByEmail(req.body.email) : null;
    let devResetUrl = null;
    if (user) {
      await PasswordReset.invalidateForUser(user.id);
      const token = crypto.randomBytes(32).toString('hex');
      await PasswordReset.create(user.id, token, new Date(Date.now() + RESET_TOKEN_TTL_MS));
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
      const result = await mailer.sendPasswordReset(user.email, resetUrl);
      if (!result.sent) devResetUrl = result.resetUrl;
    }
    res.render('auth/forgot-password', { page: 'Forgot Password', menuId: '', sent: true, devResetUrl });
  } catch (err) {
    next(err);
  }
}

async function showResetPassword(req, res, next) {
  try {
    const reset = await PasswordReset.findValidByToken(req.params.token);
    if (!reset) {
      return res.status(400).render('auth/reset-password', {
        page: 'Reset Password', menuId: '', invalid: true, token: req.params.token, errors: {}
      });
    }
    res.render('auth/reset-password', { page: 'Reset Password', menuId: '', invalid: false, token: req.params.token, errors: {} });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const reset = await PasswordReset.findValidByToken(req.params.token);
    if (!reset) {
      return res.status(400).render('auth/reset-password', {
        page: 'Reset Password', menuId: '', invalid: true, token: req.params.token, errors: {}
      });
    }

    const errors = {};
    if (!minLength(req.body.password, 8)) errors.password = 'Password must be at least 8 characters.';
    if (req.body.password !== req.body.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errors).length) {
      return res.status(400).render('auth/reset-password', { page: 'Reset Password', menuId: '', invalid: false, token: req.params.token, errors });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    await User.updatePassword(reset.user_id, passwordHash);
    await PasswordReset.markUsed(reset.id);

    res.redirect('/login?reset=1');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showRegister,
  register,
  showLogin,
  login,
  logout,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword
};
