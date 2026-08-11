const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function ensureCart(req) {
  if (req.currentUser) {
    const cart = await Cart.getOrCreateForUser(req.currentUser.id);
    req.session.cartId = cart.id;
    return cart;
  }
  if (req.session.cartId) {
    const existing = await Cart.getById(req.session.cartId);
    if (existing) return existing;
  }
  const cart = await Cart.create(null);
  req.session.cartId = cart.id;
  return cart;
}

async function viewCart(req, res, next) {
  try {
    const cart = await ensureCart(req);
    const items = await Cart.getItemsWithProducts(cart.id);
    const totals = Cart.computeTotals(items);
    res.render('cart/index', { page: 'Your Cart', menuId: 'shop', items, totals });
  } catch (err) {
    next(err);
  }
}

async function addToCart(req, res, next) {
  try {
    const cart = await ensureCart(req);
    const productId = Number(req.body.productId);
    const quantity = Math.max(1, Number(req.body.quantity) || 1);

    const product = await Product.getById(productId);
    if (!product || !product.is_active) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await Cart.addItem(cart.id, productId, quantity);
    const count = await Cart.countItems(cart.id);
    res.json({ ok: true, cartCount: count, product: { name: product.name } });
  } catch (err) {
    next(err);
  }
}

async function updateCart(req, res, next) {
  try {
    const cart = await ensureCart(req);
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);

    await Cart.setItemQuantity(cart.id, productId, quantity);

    const items = await Cart.getItemsWithProducts(cart.id);
    const totals = Cart.computeTotals(items);
    const count = await Cart.countItems(cart.id);
    res.json({ ok: true, cartCount: count, totals, itemCount: items.length });
  } catch (err) {
    next(err);
  }
}

async function removeFromCart(req, res, next) {
  try {
    const cart = await ensureCart(req);
    const productId = Number(req.body.productId || req.query.productId);

    await Cart.removeItem(cart.id, productId);

    const items = await Cart.getItemsWithProducts(cart.id);
    const totals = Cart.computeTotals(items);
    const count = await Cart.countItems(cart.id);
    res.json({ ok: true, cartCount: count, totals, itemCount: items.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { ensureCart, viewCart, addToCart, updateCart, removeFromCart };
