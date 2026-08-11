var express = require('express');
var router = express.Router();
var newsFeed = require('../services/newsFeed');
var sanityNews = require('../services/sanityNews');
var Product = require('../models/Product');

/* GET home page. */
router.get('/', function (req, res, next) {
  Product.list({ sort: 'recommended' })
    .then(function (products) {
      res.render('index', {
        page: 'Home',
        menuId: 'home',
        featured: products.slice(0, 3),
        bestsellers: products.filter(function (p) { return p.is_bestseller; }).slice(0, 3)
      });
    })
    .catch(next);
});

router.get('/news', function (req, res, next) {
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

router.get('/news/updates/:slug', function (req, res, next) {
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

router.get('/about', function (req, res, next) {
  res.render('about', { page: 'About Us', menuId: 'about' });
});

router.get('/contact', function (req, res, next) {
  res.render('contact', { page: 'Contact Us', menuId: 'contact' });
});

module.exports = router;
