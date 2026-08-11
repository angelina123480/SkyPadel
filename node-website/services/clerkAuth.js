var clerkExpress = require('@clerk/express');

var isConfigured = Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);

var bootstrapEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(function (email) { return email.trim().toLowerCase(); })
  .filter(Boolean);

function primaryEmail(user) {
  var match = user.emailAddresses.filter(function (e) { return e.id === user.primaryEmailAddressId; })[0];
  return (match ? match.emailAddress : (user.emailAddresses[0] || {}).emailAddress || '').toLowerCase();
}

function isAdminUser(user) {
  return Boolean(user && user.publicMetadata && user.publicMetadata.role === 'admin');
}

// Auto-promotes the very first admin(s): anyone signing in whose email is
// listed in ADMIN_EMAILS gets the admin role the moment they show up.
function bootstrapAdminIfNeeded(user) {
  if (isAdminUser(user)) return Promise.resolve(user);
  if (bootstrapEmails.indexOf(primaryEmail(user)) === -1) return Promise.resolve(user);

  return clerkExpress.clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: { role: 'admin' }
  });
}

// Loads the current signed-in user (if any) plus their app role.
function getCurrentUser(req) {
  if (!isConfigured) return Promise.resolve(null);

  var auth = clerkExpress.getAuth(req);
  if (!auth || !auth.userId) return Promise.resolve(null);

  return clerkExpress.clerkClient.users.getUser(auth.userId).then(function (user) {
    return bootstrapAdminIfNeeded(user);
  });
}

function requireSignedIn(req, res, next) {
  if (!isConfigured) {
    return res.status(503).render('auth/not-configured', { page: 'Sign In Required', menuId: '' });
  }

  getCurrentUser(req).then(function (user) {
    if (!user) {
      return res.redirect('/sign-in?redirect_url=' + encodeURIComponent(req.originalUrl));
    }
    req.currentUser = user;
    next();
  }).catch(next);
}

function requireAdmin(req, res, next) {
  requireSignedIn(req, res, function () {
    if (!isAdminUser(req.currentUser)) {
      return res.status(403).render('auth/forbidden', { page: 'Admins Only', menuId: '' });
    }
    next();
  });
}

function listAdmins() {
  return clerkExpress.clerkClient.users.getUserList({ limit: 100 }).then(function (result) {
    return result.data.filter(isAdminUser).map(function (user) {
      return {
        id: user.id,
        email: primaryEmail(user),
        firstName: user.firstName,
        lastName: user.lastName
      };
    });
  });
}

function inviteAdmin(email, redirectUrl) {
  return clerkExpress.clerkClient.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role: 'admin' },
    redirectUrl: redirectUrl
  });
}

function removeAdmin(userId) {
  return clerkExpress.clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { role: 'client' }
  });
}

module.exports = {
  isConfigured: isConfigured,
  isAdminUser: isAdminUser,
  primaryEmail: primaryEmail,
  getCurrentUser: getCurrentUser,
  requireSignedIn: requireSignedIn,
  requireAdmin: requireAdmin,
  listAdmins: listAdmins,
  inviteAdmin: inviteAdmin,
  removeAdmin: removeAdmin
};
