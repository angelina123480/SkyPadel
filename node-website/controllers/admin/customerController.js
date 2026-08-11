const User = require('../../models/User');

async function list(req, res, next) {
  try {
    const users = await User.listAllWithStats();
    res.render('admin/customers', {
      page: 'Manage Customers',
      menuId: '',
      users,
      promoted: req.query.promoted === '1',
      demoted: req.query.demoted === '1',
      error: req.query.error || null
    });
  } catch (err) {
    next(err);
  }
}

async function promote(req, res, next) {
  try {
    await User.setRole(Number(req.params.id), 'admin');
    res.redirect('/admin/customers?promoted=1');
  } catch (err) {
    next(err);
  }
}

async function demote(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.currentUser.id) {
      return res.redirect(`/admin/customers?error=${encodeURIComponent("You can't remove your own admin access.")}`);
    }
    await User.setRole(id, 'customer');
    res.redirect('/admin/customers?demoted=1');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, promote, demote };
