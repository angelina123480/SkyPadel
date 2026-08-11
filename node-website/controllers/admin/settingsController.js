const SiteSettings = require('../../models/SiteSettings');
const imageStorage = require('../../services/imageStorage');

async function show(req, res, next) {
  try {
    const logoUrl = await SiteSettings.get('logo_url');
    res.render('admin/settings', {
      page: 'Site Settings',
      menuId: '',
      logoUrl,
      error: req.query.error || null,
      updated: req.query.updated === '1'
    });
  } catch (err) {
    next(err);
  }
}

async function uploadLogo(req, res, next) {
  try {
    if (!req.file) {
      return res.redirect('/admin/settings?error=' + encodeURIComponent('Choose an image first.'));
    }
    const url = await imageStorage.uploadImage(req.file, 'branding');
    await SiteSettings.set('logo_url', url);
    res.redirect('/admin/settings?updated=1');
  } catch (err) {
    if (err.message && err.message.indexOf('not configured') !== -1) {
      return res.redirect('/admin/settings?error=' + encodeURIComponent(err.message));
    }
    next(err);
  }
}

async function removeLogo(req, res, next) {
  try {
    await SiteSettings.remove('logo_url');
    res.redirect('/admin/settings?updated=1');
  } catch (err) {
    next(err);
  }
}

module.exports = { show, uploadLogo, removeLogo };
