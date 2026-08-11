var sanity = require('./sanityClient');

var PORTABLE_TEXT_COMPONENTS = {
  types: {
    image: function (props) {
      var url = sanity.urlForImage(props.value);
      return url ? '<img src="' + url + '" alt="" class="post-body-image" loading="lazy">' : '';
    }
  }
};

// @portabletext/to-html is ESM-only (no CommonJS build), so it's loaded lazily
// via dynamic import() only when actually rendering a post body — a top-level
// require() would crash every route, not just the ones that need it.
function renderBody(body) {
  if (!body) return Promise.resolve('');
  return import('@portabletext/to-html').then(function (mod) {
    return mod.toHTML(body, { components: PORTABLE_TEXT_COMPONENTS });
  });
}

var LIST_QUERY = '*[_type == "post" && defined(publishedAt) && publishedAt <= now()] '
  + '| order(publishedAt desc) [0...12] {'
  + '  title, "slug": slug.current, category, excerpt, mainImage, publishedAt'
  + '}';

var POST_QUERY = '*[_type == "post" && slug.current == $slug][0] {'
  + '  title, "slug": slug.current, category, excerpt, mainImage, body, publishedAt'
  + '}';

function mapPost(doc) {
  return {
    title: doc.title,
    slug: doc.slug,
    category: doc.category || 'general',
    excerpt: doc.excerpt || '',
    image: sanity.urlForImage(doc.mainImage),
    bodyHtml: '',
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null
  };
}

function getAllPosts() {
  if (!sanity.isConfigured) return Promise.resolve([]);

  return sanity.client.fetch(LIST_QUERY)
    .then(function (docs) { return docs.map(mapPost); })
    .catch(function (err) {
      console.error('SkyPadel Sanity: failed to fetch posts —', err.message);
      return [];
    });
}

function getPostBySlug(slug) {
  if (!sanity.isConfigured) return Promise.resolve(null);

  return sanity.client.fetch(POST_QUERY, { slug: slug })
    .then(function (doc) {
      if (!doc) return null;
      var post = mapPost(doc);
      return renderBody(doc.body).then(function (html) {
        post.bodyHtml = html;
        return post;
      });
    })
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
