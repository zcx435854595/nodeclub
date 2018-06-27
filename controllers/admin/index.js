/*!
 * nodeclub - site index controller.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * Copyright(c) 2012 muyuan
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var at           = require('../../common/at');
var message      = require('../../common/message');
var User         = require('../../proxy').User;
var Topic        = require('../../proxy').Topic;
var mail         = require('../../common/mail');
var config       = require('../../config');
var eventproxy   = require('eventproxy');
var cache        = require('../../common/cache');
var xmlbuilder   = require('xmlbuilder');
var renderHelper = require('../../common/render_helper');
var _            = require('lodash');
var moment = require('moment');

exports.index = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var review_state = req.query.review_state || '';
  var tab = req.query.tab || 'all';
  var proxy = new eventproxy();
  proxy.fail(next);

  // 取主题
  var query = {};
  if (!tab || tab === 'all') {
    query.tab = {$nin: ['job', 'dev']}
  } else {
    if (tab === 'good') {
      query.good = true;
    } else {
      query.tab = tab;
    }
  }
  if(review_state){
    query.review_state = review_state;
  }
  if (!query.good) {
    query.create_at = {$gte: moment().subtract(1, 'years').toDate()}
  }

  var limit = config.list_topic_count;
  var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};

  Topic.getTopicsByQuery(query, options, proxy.done('topics', function (topics) {
    return topics;
  }));

  // 取排行榜上的用户
  cache.get('tops', proxy.done(function (tops) {
    if (tops) {
      proxy.emit('tops', tops);
    } else {
      User.getUsersByQuery(
        {is_block: false},
        { limit: 10, sort: '-score'},
        proxy.done('tops', function (tops) {
          cache.set('tops', tops, 60 * 1);
          return tops;
        })
      );
    }
  }));
  // END 取排行榜上的用户

  // 取0回复的主题
  cache.get('no_reply_topics', proxy.done(function (no_reply_topics) {
    if (no_reply_topics) {
      proxy.emit('no_reply_topics', no_reply_topics);
    } else {
      Topic.getTopicsByQuery(
        { reply_count: 0, tab: {$nin: ['job', 'dev']}},
        { limit: 5, sort: '-create_at'},
        proxy.done('no_reply_topics', function (no_reply_topics) {
          cache.set('no_reply_topics', no_reply_topics, 60 * 1);
          return no_reply_topics;
        }));
    }
  }));
  // END 取0回复的主题

  // 取分页数据
  var pagesCacheKey = JSON.stringify(query) + 'pages';
  cache.get(pagesCacheKey, proxy.done(function (pages) {
    if (pages) {
      proxy.emit('pages', pages);
    } else {
      Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = Math.ceil(all_topics_count / limit);
        cache.set(pagesCacheKey, pages, 60 * 1);
        proxy.emit('pages', pages);
      }));
    }
  }));
  // END 取分页数据

  var tabName = renderHelper.tabName(tab);
  proxy.all('topics', 'tops', 'no_reply_topics', 'pages',
    function (topics, tops, no_reply_topics, pages) {
      res.render('admin/index', {
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        tops: tops,
        no_reply_topics: no_reply_topics,
        pages: pages,
        tabs: config.tabs,
        tab: tab,
        review_state: review_state,
        pageTitle: tabName && (tabName + '版块'),
      });
    });
};

exports.review = function (req, res, next) {
  var topic_id = req.body.topic_id;
  var review_state = req.body.review_state;
  // var referer  = req.get('referer');

  var ep = new eventproxy();
  ep.fail(next);


  Topic.getTopicById(topic_id, function (err, topic) {
    if (!topic) {
      res.render404('此情书不存在或已被删除。');
      return;
    }

    topic.review_state = review_state;
    topic.update_at = new Date();
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      ep.emit('topic', topic);
      
    });
  });
  ep.all('topic', function (topic) {
    //发送system消息
    var content = '您的情书已经被审核，请去查看结果';  
    message.sendSystemMessage(content, topic.author_id, topic._id, function(){
      res.send({
        success: true
      });
    });  
  })
};

exports.reviewAndSend = function (req, res, next) {
  var topic_id     = req.body.topic_id;
  var review_state = 'pass';
  // var referer  = req.get('referer');

  var ep = new eventproxy();
  ep.fail(next);


  Topic.getTopicById(topic_id, function (err, topic) {
    if (!topic) {
      res.render404('此情书不存在或已被删除。');
      return;
    }

    topic.review_state = review_state;
    topic.has_send = true;
    topic.update_at = new Date();
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      ep.emit('topic', topic);
      
    });
  });
  ep.all('topic', function (topic) {

    if(topic.to_email) {
      mail.sendLoveMail(topic.to_email, topic.content);
    }
    if(topic.to_tel) {
      // mail.sendLoveMail(topic.to_email, topic.content);
    }
    
    //发送system消息
    var content = '您的情书已经被审核，请去查看结果';  
    message.sendSystemMessage(content, topic.author_id, topic._id, function(){
      res.send({
        success: true
      });
    });

  })
};

