var Parser = require('rss-parser');

var REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day
var ITEMS_PER_CATEGORY = 6;

// Direct publisher feeds — real snippets, real images where available,
// and links that go straight to the original article (no Google detour).
var SOURCES = [
  { category: 'tennis', name: 'The Guardian', url: 'https://www.theguardian.com/sport/tennis/rss' },
  { category: 'tennis', name: 'BBC Sport', url: 'http://feeds.bbci.co.uk/sport/tennis/rss.xml' },
  { category: 'tennis', name: 'ESPN', url: 'https://www.espn.com/espn/rss/tennis/news' },
  { category: 'padel', name: 'The Guardian', url: 'https://www.theguardian.com/sport/padel/rss' }
];

var parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
});

var cache = {
  items: [],
  lastUpdated: null
};

var pendingRefresh = null;

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/Continue reading\.\.\.\s*$/i, '')
    .trim();
}

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function extractImage(item) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;

  if (item.mediaThumbnail) {
    if (typeof item.mediaThumbnail === 'string') return item.mediaThumbnail;
    if (item.mediaThumbnail.$ && item.mediaThumbnail.$.url) return item.mediaThumbnail.$.url;
  }

  if (item.mediaContent) {
    var list = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      if (entry && entry.$ && entry.$.url) return entry.$.url;
    }
  }

  return null;
}

function fetchSource(source) {
  return parser.parseURL(source.url).then(function (feed) {
    return (feed.items || []).map(function (item) {
      var published = item.isoDate ? new Date(item.isoDate) : (item.pubDate ? new Date(item.pubDate) : new Date());
      var rawSnippet = item.contentSnippet || item.content || item.summary || item.description || '';
      return {
        category: source.category,
        title: (item.title || '').trim(),
        snippet: truncate(stripHtml(rawSnippet), 170),
        source: source.name,
        link: item.link,
        image: extractImage(item),
        publishedAt: published
      };
    });
  }).catch(function (err) {
    console.error('SkyPadel news: failed to fetch ' + source.name + ' (' + source.category + ') —', err.message);
    return [];
  });
}

function refreshCache() {
  return Promise.all(SOURCES.map(fetchSource)).then(function (results) {
    var byCategory = {};

    results.forEach(function (items) {
      items.forEach(function (item) {
        if (!byCategory[item.category]) byCategory[item.category] = [];
        byCategory[item.category].push(item);
      });
    });

    var merged = Object.keys(byCategory).reduce(function (acc, category) {
      var sorted = byCategory[category]
        .sort(function (a, b) { return b.publishedAt - a.publishedAt; })
        .slice(0, ITEMS_PER_CATEGORY);
      return acc.concat(sorted);
    }, []);

    merged.sort(function (a, b) { return b.publishedAt - a.publishedAt; });

    if (merged.length > 0) {
      cache.items = merged;
      cache.lastUpdated = new Date();
    }
    return cache;
  });
}

function ensureFresh() {
  var isStale = !cache.lastUpdated || (Date.now() - cache.lastUpdated.getTime()) > REFRESH_INTERVAL_MS;
  if (isStale && !pendingRefresh) {
    pendingRefresh = refreshCache().finally(function () {
      pendingRefresh = null;
    });
  }
  return pendingRefresh || Promise.resolve(cache);
}

// Warm the cache as soon as the server starts, so the first visitor
// doesn't have to wait on a cold fetch.
ensureFresh();

module.exports = {
  getNews: function () {
    return ensureFresh().then(function () {
      return cache;
    });
  }
};
