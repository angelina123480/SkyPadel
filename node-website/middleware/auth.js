const User = require('../models/User');
const Cart = require('../models/Cart');
const SiteSettings = require('../models/SiteSettings');

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function bootstrapAdminIfNeeded(user) {
  if (user.role === 'admin') return user;
  if (adminEmails().includes(user.email.toLowerCase())) {
    return User.setRole(user.id, 'admin');
  }
  return user;
}

async function attachUser(req, res, next) {
  try {
    let currentUser = null;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
      if (!currentUser) {
        req.session.userId = null;
      }
    }
    req.currentUser = currentUser;
    res.locals.currentUser = currentUser;
    res.locals.isSignedIn = Boolean(currentUser);
    res.locals.isAdmin = Boolean(currentUser && currentUser.role === 'admin');
    res.locals.cartCount = req.session.cartId ? await Cart.countItems(req.session.cartId) : 0;
    res.locals.logoUrl = await SiteSettings.get('logo_url');
    next();
  } catch (err) {
    next(err);
  }
}

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser) {
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.currentUser.role !== 'admin') {
    return res.status(403).render('auth/forbidden', { page: 'Forbidden', menuId: '' });
  }
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin, bootstrapAdminIfNeeded, adminEmails };
