const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Order = require('../models/Order');
const { ensureCart } = require('./cartController');
const { validateShipping, validatePayment } = require('../middleware/validate');

async function showCheckout(req, res, next) {
  try {
    const cart = await ensureCart(req);
    const items = await Cart.getItemsWithProducts(cart.id);
    if (items.length === 0) {
      return res.redirect('/cart');
    }
    const totals = Cart.computeTotals(items);
    const savedAddress = await Address.getDefaultForUser(req.currentUser.id);

    res.render('checkout/index', {
      page: 'Checkout',
      menuId: 'shop',
      items,
      totals,
      errors: {},
      values: {
        firstName: savedAddress ? savedAddress.first_name : req.currentUser.first_name,
        lastName: savedAddress ? savedAddress.last_name : req.currentUser.last_name,
        email: req.currentUser.email,
        phone: (savedAddress && savedAddress.phone) || req.currentUser.phone || '',
        country: savedAddress ? savedAddress.country : '',
        city: savedAddress ? savedAddress.city : '',
        addressLine: savedAddress ? savedAddress.address_line : '',
        apartment: savedAddress ? savedAddress.apartment : '',
        postalCode: savedAddress ? savedAddress.postal_code : ''
      }
    });
  } catch (err) {
    next(err);
  }
}

async function placeOrder(req, res, next) {
  try {
    const cart = await ensureCart(req);
    const items = await Cart.getItemsWithProducts(cart.id);
    if (items.length === 0) {
      return res.redirect('/cart');
    }
    const totals = Cart.computeTotals(items);

    const shippingErrors = validateShipping(req.body);
    const { errors: paymentErrors, digits, brand } = validatePayment(req.body);
    const errors = { ...shippingErrors, ...paymentErrors };

    if (Object.keys(errors).length) {
      return res.status(400).render('checkout/index', {
        page: 'Checkout', menuId: 'shop', items, totals, errors, values: { ...req.body, cardNumber: '', cvv: '' }
      });
    }

    if (req.body.saveAddress) {
      await Address.upsertDefault(req.currentUser.id, req.body);
    }

    const order = await Order.createFromCart({
      userId: req.currentUser.id,
      cartId: cart.id,
      shipping: req.body,
      card: { last4: digits.slice(-4), brand }
    });

    res.redirect(`/orders/${order.id}?justPlaced=1`);
  } catch (err) {
    if (err instanceof Order.CheckoutError) {
      try {
        const cart = await ensureCart(req);
        const items = await Cart.getItemsWithProducts(cart.id);
        const totals = Cart.computeTotals(items);
        return res.status(400).render('checkout/index', {
          page: 'Checkout', menuId: 'shop', items, totals, errors: { form: err.message }, values: { ...req.body, cardNumber: '', cvv: '' }
        });
      } catch (innerErr) {
        return next(innerErr);
      }
    }
    next(err);
  }
}

module.exports = { showCheckout, placeOrder };
