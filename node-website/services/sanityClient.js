var sanityClient = require('@sanity/client');

var projectId = process.env.SANITY_PROJECT_ID;
var dataset = process.env.SANITY_DATASET || 'production';
var apiVersion = process.env.SANITY_API_VERSION || '2025-01-01';

var isConfigured = Boolean(projectId);

var client = isConfigured
  ? sanityClient.createClient({
      projectId: projectId,
      dataset: dataset,
      apiVersion: apiVersion,
      useCdn: true
    })
  : null;

// Hand-rolled instead of depending on @sanity/image-url (an ESM-only package
// that fails to require() on Vercel's serverless runtime) — Sanity's image
// asset refs follow a simple, stable, documented pattern:
// "image-<assetId>-<width>x<height>-<format>".
function urlForImage(source) {
  if (!isConfigured || !source) return null;
  var ref = source.asset && (source.asset._ref || source.asset._id);
  if (!ref) return null;

  var parts = ref.replace(/^image-/, '').split('-');
  if (parts.length < 3) return null;
  var format = parts.pop();
  var dimensions = parts.pop();
  var assetId = parts.join('-');

  return 'https://cdn.sanity.io/images/' + projectId + '/' + dataset + '/' + assetId + '-' + dimensions + '.' + format;
}

module.exports = {
  isConfigured: isConfigured,
  client: client,
  urlForImage: urlForImage
};
