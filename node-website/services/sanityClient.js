var sanityClient = require('@sanity/client');
var createImageUrlBuilder = require('@sanity/image-url').createImageUrlBuilder;

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

var urlBuilder = isConfigured ? createImageUrlBuilder(client) : null;

function urlForImage(source) {
  if (!urlBuilder || !source) return null;
  return urlBuilder.image(source).auto('format').url();
}

module.exports = {
  isConfigured: isConfigured,
  client: client,
  urlForImage: urlForImage
};
