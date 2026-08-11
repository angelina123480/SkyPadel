const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const dashboardController = require('../controllers/admin/dashboardController');
const productController = require('../controllers/admin/productController');
const orderController = require('../controllers/admin/orderController');
const customerController = require('../controllers/admin/customerController');
const deliveryZoneController = require('../controllers/admin/deliveryZoneController');
const settingsController = require('../controllers/admin/settingsController');

router.use(requireAdmin);

router.get('/', dashboardController.index);

router.get('/products', productController.list);
router.get('/products/new', productController.showNew);
router.post('/products', uploadImage.single('image'), productController.create);
router.get('/products/:id/edit', productController.showEdit);
router.put('/products/:id', uploadImage.single('image'), productController.update);
router.delete('/products/:id', productController.remove);

router.get('/inventory', productController.inventory);

router.get('/orders', orderController.list);
router.get('/orders/:id', orderController.detail);
router.put('/orders/:id', orderController.updateStatus);

router.get('/customers', customerController.list);
router.post('/customers/:id/promote', customerController.promote);
router.post('/customers/:id/demote', customerController.demote);

router.get('/delivery-zones', deliveryZoneController.index);
router.put('/delivery-zones/:id', deliveryZoneController.setEnabled);

router.get('/settings', settingsController.show);
router.post('/settings/logo', uploadImage.single('logo'), settingsController.uploadLogo);
router.delete('/settings/logo', settingsController.removeLogo);

module.exports = router;
