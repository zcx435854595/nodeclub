/*!
 * nodeclub - route.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var express = require('express');
var admin = require('./controllers/admin/index');
var auth = require('./middlewares/auth');
var limit = require('./middlewares/limit');
var config = require('./config');

var router = express.Router();

// admin home page
router.get('/', auth.adminRequired, admin.index);
router.post('/review', auth.adminRequired, admin.review);



if (!config.debug) { // 这个兼容破坏了不少测试
	router.get('/:name', function (req, res) {
	  res.redirect('/user/' + req.params.name)
	})
}


module.exports = router;
