const Order = require('../../models/Order');

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

async function list(req, res, next) {
  try {
    const orders = await Order.adminList({ status: req.query.status || '', search: req.query.search || '' });
    res.render('admin/orders/list', {
      page: 'Manage Orders', menuId: '', orders, statuses: STATUSES,
      currentStatus: req.query.status || '', search: req.query.search || ''
    });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const order = await Order.getById(Number(req.params.id));
    if (!order) {
      const err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
    res.render('admin/orders/detail', { page: `Order ${order.order_number}`, menuId: '', order, statuses: STATUSES });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({ ok: false, error: 'Invalid status.' });
    }
    const order = await Order.updateStatus(Number(req.params.id), req.body.status);
    if (!order) {
      return res.status(404).json({ ok: false, error: 'Order not found.' });
    }
    res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, updateStatus, STATUSES };
