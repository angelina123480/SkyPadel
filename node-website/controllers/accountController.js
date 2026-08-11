const bcrypt = require('bcryptjs');
const Order = require('../models/Order');
const User = require('../models/User');
const Address = require('../models/Address');
const { minLength, required } = require('../middleware/validate');

const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'];

async function dashboard(req, res, next) {
  try {
    const orders = await Order.listByUser(req.currentUser.id);
    const totalSpent = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0);

    res.render('account/dashboard', {
      page: 'My Account',
      menuId: 'account',
      totalOrders: orders.length,
      currentOrders: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      completedOrders: orders.filter((o) => o.status === 'delivered').length,
      totalSpent,
      recentOrders: orders.slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
}

async function showProfile(req, res, next) {
  try {
    const address = await Address.getDefaultForUser(req.currentUser.id);
    res.render('account/profile', { page: 'Profile', menuId: 'account', errors: {}, address, updated: req.query.updated === '1' });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const errors = {};
    if (!required(req.body.firstName)) errors.firstName = 'First name is required.';
    if (!required(req.body.lastName)) errors.lastName = 'Last name is required.';
    if (Object.keys(errors).length) {
      const address = await Address.getDefaultForUser(req.currentUser.id);
      return res.status(400).render('account/profile', { page: 'Profile', menuId: 'account', errors, address, updated: false });
    }

    await User.updateProfile(req.currentUser.id, {
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      phone: req.body.phone
    });

    if (required(req.body.addressLine)) {
      await Address.upsertDefault(req.currentUser.id, req.body);
    }

    res.redirect('/account/profile?updated=1');
  } catch (err) {
    next(err);
  }
}

function showSettings(req, res) {
  res.render('account/settings', {
    page: 'Settings',
    menuId: 'account',
    errors: {},
    hasPassword: Boolean(req.currentUser.password_hash),
    passwordUpdated: req.query.passwordUpdated === '1',
    notifyUpdated: req.query.notifyUpdated === '1'
  });
}

async function updatePassword(req, res, next) {
  try {
    const errors = {};
    const hasPassword = Boolean(req.currentUser.password_hash);
    if (hasPassword) {
      const match = await bcrypt.compare(req.body.currentPassword || '', req.currentUser.password_hash);
      if (!match) errors.currentPassword = 'Current password is incorrect.';
    }
    if (!minLength(req.body.newPassword, 8)) errors.newPassword = 'New password must be at least 8 characters.';
    if (req.body.newPassword !== req.body.confirmPassword) errors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(errors).length) {
      return res.status(400).render('account/settings', {
        page: 'Settings', menuId: 'account', errors, hasPassword, passwordUpdated: false, notifyUpdated: false
      });
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    await User.updatePassword(req.currentUser.id, passwordHash);
    res.redirect('/account/settings?passwordUpdated=1');
  } catch (err) {
    next(err);
  }
}

async function updateNotifications(req, res, next) {
  try {
    await User.updateNotifyEmail(req.currentUser.id, Boolean(req.body.notifyEmail));
    res.redirect('/account/settings?notifyUpdated=1');
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, showProfile, updateProfile, showSettings, updatePassword, updateNotifications };
