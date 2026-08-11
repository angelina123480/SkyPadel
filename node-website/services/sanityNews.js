var sanity = require('./sanityClient');
var toHTML = require('@portabletext/to-html').toHTML;

var PORTABLE_TEXT_COMPONENTS = {
  types: {
    image: function (props) {
      var url = sanity.urlForImage(props.value);
      return url ? '<img src="' + url + '" alt="" class="post-body-image" loading="lazy">' : '';
    }
  }
};

var LIST_QUERY = '*[_type == "post" && defined(publishedAt) && publishedAt <= now()] '
  + '| order(publishedAt desc) [0...12] {'
  + '  title, "slug": slug.current, category, excerpt, mainImage, publishedAt'
  + '}';

var POST_QUERY = '*[_type == "post" && slug.current == $slug][0] {'
  + '  title, "slug": slug.current, category, excerpt, mainImage, body, publishedAt'
  + '}';

function mapPost(doc, includeBody) {
  return {
    title: doc.title,
    slug: doc.slug,
    category: doc.category || 'general',
    excerpt: doc.excerpt || '',
    image: sanity.urlForImage(doc.mainImage),
    bodyHtml: includeBody && doc.body ? toHTML(doc.body, { components: PORTABLE_TEXT_COMPONENTS }) : '',
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null
  };
}

function getAllPosts() {
  if (!sanity.isConfigured) return Promise.resolve([]);

  return sanity.client.fetch(LIST_QUERY)
    .then(function (docs) { return docs.map(function (doc) { return mapPost(doc, false); }); })
    .catch(function (err) {
      console.error('SkyPadel Sanity: failed to fetch posts —', err.message);
      return [];
    });
}

function getPostBySlug(slug) {
  if (!sanity.isConfigured) return Promise.resolve(null);

  return sanity.client.fetch(POST_QUERY, { slug: slug })
    .then(function (doc) { return doc ? mapPost(doc, true) : null; })
    .catch(function (err) {
      console.error('SkyPadel Sanity: failed to fetch post "' + slug + '" —', err.message);
      return null;
    });
}

module.exports = {
  isConfigured: sanity.isConfigured,
  getAllPosts: getAllPosts,
  getPostBySlug: getPostBySlug
};
