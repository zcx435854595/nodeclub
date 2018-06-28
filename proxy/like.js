var EventProxy = require('eventproxy');
var _ = require('lodash');

var Like = require('../models').Like;

var User = require('./user');
var Topic = require('./topic');
var Reply = require('./reply');

/**
 * 根据用户ID，获取未读消息的数量
 * Callback:
 * 回调函数参数列表：
 * - err, 数据库错误
 * - count, 未读消息数量
 * @param {String} id 用户ID
 * @param {Function} callback 获取消息数量
 */
exports.getMessagesCount = function (id, callback) {
  Like.count({master_id: id, has_read: false}, callback);
};

/**
 * 根据type与id来点赞
 * @param {类型：文章或是评论} type 点赞的类型，文章或是评论
 * @param {String} master_id topic或reply的id
 * @param {Function} callback 返回记录
 */
exports.likeThis = function (type, like_id, master_id, callback) {
  Like.findOne({type: type, like_id: like_id, master_id: master_id}, function (err, like) {
    if (err) {
      return callback(err);
    }
    var proxy = new EventProxy();
    proxy.fail(callback);

    if (!like) {
      var like       = new Like();
      like.type      = type;
      like.master_id = master_id;
      like.like_id   = like_id;
      like.save(function (err) {
        proxy.emit('like', null);
      });

      if(type === 'topic') {
        Topic.addLikeCount(master_id, function () {
          proxy.emit('count', null);
        })
      } else if (type === 'reply'){
        Reply.addLikeCount(master_id, function () {
          proxy.emit('count', null);
        })
      }
      proxy.all('like', 'count', function () {
        callback()
      })
    }
  });
};

/**
 * 根据type与id来取消点赞
 * @param {类型：文章或是评论} type 点赞的类型，文章或是评论
 * @param {String} master_id topic或reply的id
 * @param {Function} callback 返回记录
 */
exports.unlikeThis = function (type, like_id, master_id, callback) {
  Like.findOne({ type: type, like_id: like_id, master_id: master_id }, function (err, like) {
    if (err || !like) {
      return callback(err);
    }

    var proxy = new EventProxy();
    proxy.fail(callback);
    
    if (like) {
      like.remove(function (err) {
        proxy.emit('like', null);
      });

      if (type === 'topic') {
        Topic.reduceLikeCount(master_id, function () {
          proxy.emit('count', null);
        })
      } else {
        Reply.reduceLikeCount(master_id, function () {
          proxy.emit('count', null);
        })
      }
      proxy.all('like', 'count', function () {
        callback()
      })
    }
    
    
  });
};

