const Product = require('../../models/Product');
const imageStorage = require('../../services/imageStorage');
const { required } = require('../../middleware/validate');

function validateProduct(body) {
  const errors = {};
  if (!required(body.name)) errors.name = 'Name is required.';
  if (!required(body.description)) errors.description = 'Description is required.';
  const cans = Number(body.cans);
  const ballsPerCan = Number(body.ballsPerCan);
  const price = Number(body.price);
  const stock = Number(body.stock);
  if (!Number.isInteger(cans) || cans <= 0) errors.cans = 'Cans must be a positive whole number.';
  if (!Number.isInteger(ballsPerCan) || ballsPerCan <= 0) errors.ballsPerCan = 'Balls per can must be a positive whole number.';
  if (Number.isNaN(price) || price < 0) errors.price = 'Enter a valid price.';
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Enter a valid stock quantity.';
  if (required(body.compareAtPrice)) {
    const compareAtPrice = Number(body.compareAtPrice);
    if (Number.isNaN(compareAtPrice) || compareAtPrice <= price) {
      errors.compareAtPrice = 'Original price must be higher than the price.';
    }
  }
  return errors;
}

async function list(req, res, next) {
  try {
    const products = await Product.adminList();
    res.render('admin/products/list', { page: 'Manage Products', menuId: '', products, created: req.query.created === '1' });
  } catch (err) {
    next(err);
  }
}

function showNew(req, res) {
  res.render('admin/products/form', { page: 'New Product', menuId: '', product: null, errors: {} });
}

async function showEdit(req, res, next) {
  try {
    const product = await Product.getById(Number(req.params.id));
    if (!product) {
      const err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
    res.render('admin/products/form', { page: 'Edit Product', menuId: '', product, errors: {} });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const errors = validateProduct(req.body);
    if (!req.file) errors.image = 'Product image is required.';
    if (Object.keys(errors).length) {
      return res.status(400).json({ ok: false, errors });
    }

    let imagePath;
    try {
      imagePath = await imageStorage.uploadImage(req.file, 'products');
    } catch (uploadErr) {
      return res.status(400).json({ ok: false, errors: { image: uploadErr.message } });
    }

    const product = await Product.adminCreate({
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      cans: Number(req.body.cans),
      ballsPerCan: Number(req.body.ballsPerCan),
      price: Number(req.body.price),
      compareAtPrice: req.body.compareAtPrice ? Number(req.body.compareAtPrice) : null,
      brand: req.body.brand,
      ballType: req.body.ballType,
      durabilityRating: req.body.durabilityRating,
      speedRating: req.body.speedRating,
      recommendedUse: req.body.recommendedUse,
      badge: req.body.badge,
      stock: Number(req.body.stock),
      isBestseller: req.body.isBestseller === 'on' || req.body.isBestseller === 'true',
      isActive: true,
      imagePath
    });

    res.json({ ok: true, product, redirect: '/admin/products?created=1' });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const errors = validateProduct(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ ok: false, errors });
    }

    let imagePath = null;
    if (req.file) {
      try {
        imagePath = await imageStorage.uploadImage(req.file, 'products');
      } catch (uploadErr) {
        return res.status(400).json({ ok: false, errors: { image: uploadErr.message } });
      }
    }

    const product = await Product.adminUpdate(id, {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      cans: Number(req.body.cans),
      ballsPerCan: Number(req.body.ballsPerCan),
      price: Number(req.body.price),
      compareAtPrice: req.body.compareAtPrice ? Number(req.body.compareAtPrice) : null,
      brand: req.body.brand,
      ballType: req.body.ballType,
      durabilityRating: req.body.durabilityRating,
      speedRating: req.body.speedRating,
      recommendedUse: req.body.recommendedUse,
      badge: req.body.badge,
      stock: Number(req.body.stock),
      isBestseller: req.body.isBestseller === 'on' || req.body.isBestseller === 'true',
      isActive: req.body.isActive !== 'false',
      imagePath
    });

    if (!product) {
      return res.status(404).json({ ok: false, errors: { form: 'Product not found.' } });
    }
    res.json({ ok: true, product, redirect: '/admin/products?updated=1' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Product.adminDelete(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function inventory(req, res, next) {
  try {
    const products = await Product.adminList();
    res.render('admin/inventory', { page: 'Inventory', menuId: '', products });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, showNew, showEdit, create, update, remove, inventory };
