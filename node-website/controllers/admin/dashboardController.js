const Order = require('../../models/Order');
const Product = require('../../models/Product');

async function index(req, res, next) {
  try {
    const [stats, lowStockProducts, products] = await Promise.all([
      Order.statsForAdmin(),
      Product.lowStock(5),
      Product.adminList()
    ]);

    const activeProducts = products.filter((p) => p.is_active);

    res.render('admin/dashboard', {
      page: 'Admin Dashboard',
      menuId: '',
      stats,
      lowStockProducts,
      productsInStock: activeProducts.filter((p) => p.stock > 0).length,
      totalProducts: activeProducts.length
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
