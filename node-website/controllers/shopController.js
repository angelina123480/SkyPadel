const Product = require('../models/Product');
const Review = require('../models/Review');

async function list(req, res, next) {
  try {
    const filters = {
      search: req.query.q || '',
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : null,
      minBalls: req.query.minBalls ? Number(req.query.minBalls) : null,
      brand: req.query.brand || '',
      speed: req.query.speed || '',
      bestsellerOnly: req.query.bestseller === '1',
      inStockOnly: req.query.inStock === '1',
      sort: req.query.sort || 'recommended'
    };

    const [products, brands, priceRange] = await Promise.all([
      Product.list(filters),
      Product.distinctBrands(),
      Product.priceRange()
    ]);

    const bestValue = products.reduce((best, p) => {
      const ppb = Number(p.price) / p.total_balls;
      if (!best || ppb < best.ppb) return { id: p.id, ppb };
      return best;
    }, null);

    res.render('shop/index', {
      page: 'Shop',
      menuId: 'shop',
      products,
      brands,
      priceRange,
      filters,
      bestValueId: bestValue ? bestValue.id : null
    });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    const product = await Product.getBySlug(req.params.slug);
    if (!product) {
      const err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }

    const [related, reviews] = await Promise.all([
      Product.getRelated(product.id, 3),
      Review.listForProduct(product.id)
    ]);

    let canReview = false;
    let alreadyReviewed = false;
    if (req.currentUser) {
      const [purchased, reviewed] = await Promise.all([
        Review.hasUserPurchased(req.currentUser.id, product.id),
        Review.hasUserReviewed(req.currentUser.id, product.id)
      ]);
      canReview = purchased && !reviewed;
      alreadyReviewed = reviewed;
    }

    res.render('shop/product', {
      page: product.name,
      menuId: 'shop',
      product,
      related,
      reviews,
      canReview,
      alreadyReviewed,
      reviewError: req.query.reviewError || null,
      reviewed: req.query.reviewed === '1'
    });
  } catch (err) {
    next(err);
  }
}

async function addReview(req, res, next) {
  try {
    const product = await Product.getBySlug(req.params.slug);
    if (!product) {
      const err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }

    const purchased = await Review.hasUserPurchased(req.currentUser.id, product.id);
    if (!purchased) {
      return res.redirect(`/shop/${product.slug}?reviewError=${encodeURIComponent('Only customers who purchased this product can leave a review.')}`);
    }
    const alreadyReviewed = await Review.hasUserReviewed(req.currentUser.id, product.id);
    if (alreadyReviewed) {
      return res.redirect(`/shop/${product.slug}?reviewError=${encodeURIComponent('You already reviewed this product.')}`);
    }

    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      return res.redirect(`/shop/${product.slug}?reviewError=${encodeURIComponent('Enter a rating and a comment.')}`);
    }

    await Review.create({ productId: product.id, userId: req.currentUser.id, rating, comment });
    res.redirect(`/shop/${product.slug}?reviewed=1`);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, show, addReview };
