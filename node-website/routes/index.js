var express = require('express');
var router = express.Router();
var newsFeed = require('../services/newsFeed');
var sanityNews = require('../services/sanityNews');

/* Ball bundle catalog (placeholder data — will move to a database/API later). */
var padelBundles = [
  {
    id: 'padel-starter',
    name: 'Starter Tube',
    tag: null,
    balls: 3,
    tubes: 1,
    price: 9.99,
    unitLabel: '1 tube &middot; 3 balls',
    blurb: 'One pressurized tube to try SkyPadel bounce and control.'
  },
  {
    id: 'padel-match',
    name: 'Match Pack',
    tag: 'Most Popular',
    balls: 9,
    tubes: 3,
    price: 26.99,
    unitLabel: '3 tubes &middot; 9 balls',
    blurb: 'The sweet spot for weekly players who don’t want to run out mid-season.'
  },
  {
    id: 'padel-club',
    name: 'Club Case',
    tag: 'Best Value',
    balls: 72,
    tubes: 24,
    price: 189.99,
    unitLabel: '24 tubes &middot; 72 balls',
    blurb: 'Bulk pricing built for clubs, coaches and academies.'
  }
];

var tennisBundles = [
  {
    id: 'tennis-starter',
    name: 'Starter Tube',
    tag: null,
    balls: 4,
    tubes: 1,
    price: 7.99,
    unitLabel: '1 tube &middot; 4 balls',
    blurb: 'A single tube of SkyPadel tennis balls for practice or a quick match.'
  },
  {
    id: 'tennis-match',
    name: 'Match Pack',
    tag: 'Most Popular',
    balls: 12,
    tubes: 3,
    price: 20.99,
    unitLabel: '3 tubes &middot; 12 balls',
    blurb: 'Enough consistent bounce for a full season of club matches.'
  },
  {
    id: 'tennis-club',
    name: 'Club Case',
    tag: 'Best Value',
    balls: 72,
    tubes: 18,
    price: 109.99,
    unitLabel: '18 tubes &middot; 72 balls',
    blurb: 'The lowest price per ball, built for clubs and academies.'
  }
];

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    page: 'Home',
    menuId: 'home',
    featured: [padelBundles[1], tennisBundles[1], padelBundles[2]]
  });
});

router.get('/shop', function(req, res, next) {
  res.render('shop', {
    page: 'Shop',
    menuId: 'shop',
    padelBundles: padelBundles,
    tennisBundles: tennisBundles
  });
});

router.get('/news', function(req, res, next) {
  Promise.all([newsFeed.getNews(), sanityNews.getAllPosts()]).then(function (results) {
    var feedData = results[0];
    var updates = results[1];
    res.render('news', {
      page: 'News',
      menuId: 'news',
      newsItems: feedData.items,
      lastUpdated: feedData.lastUpdated,
      updates: updates,
      sanityConfigured: sanityNews.isConfigured
    });
  }).catch(next);
});

router.get('/news/updates/:slug', function(req, res, next) {
  sanityNews.getPostBySlug(req.params.slug).then(function (post) {
    if (!post) {
      var err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
    res.render('news-post', {
      page: post.title,
      menuId: 'news',
      post: post
    });
  }).catch(next);
});

router.get('/about', function(req, res, next) {
  res.render('about', {page:'About Us', menuId:'about'});
});

router.get('/contact', function(req, res, next) {
  res.render('contact', {page:'Contact Us', menuId:'contact'});
});

module.exports = router;
