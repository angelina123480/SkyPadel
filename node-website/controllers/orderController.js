const Order = require('../models/Order');

async function listOrders(req, res, next) {
  try {
    const orders = await Order.listByUser(req.currentUser.id);
    res.render('account/orders', { page: 'My Orders', menuId: 'account', orders });
  } catch (err) {
    next(err);
  }
}

async function showOrder(req, res, next) {
  try {
    const order = await Order.getById(Number(req.params.id));
    if (!order) {
      const err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
    if (order.user_id !== req.currentUser.id && req.currentUser.role !== 'admin') {
      return res.status(403).render('auth/forbidden', { page: 'Forbidden', menuId: '' });
    }
    res.render('account/order-detail', {
      page: `Order ${order.order_number}`,
      menuId: 'account',
      order,
      justPlaced: req.query.justPlaced === '1'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listOrders, showOrder };
