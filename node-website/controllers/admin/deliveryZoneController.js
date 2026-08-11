const DeliveryZone = require('../../models/DeliveryZone');

async function index(req, res, next) {
  try {
    const zones = await DeliveryZone.listAll();
    res.render('admin/delivery-zones', { page: 'Delivery Zones', menuId: '', zones });
  } catch (err) {
    next(err);
  }
}

async function setEnabled(req, res, next) {
  try {
    const zone = await DeliveryZone.setEnabled(Number(req.params.id), Boolean(req.body.enabled));
    if (!zone) {
      return res.status(404).json({ ok: false, error: 'Zone not found.' });
    }
    res.json({ ok: true, zone });
  } catch (err) {
    next(err);
  }
}

module.exports = { index, setEnabled };
