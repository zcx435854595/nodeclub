var Message    = require('../proxy').Message;
var Like       = require('../proxy').Like;

var eventproxy = require('eventproxy');

exports.likethis = function (req, res, next) {
  var type = req.body.type;
  var like_id = req.session.user._id;
  var master_id = req.body.id;

  Like.likeThis(type, like_id, master_id, function() {
    res.json({status: 'success'});
    return
  })

};
exports.unlikethis = function (req, res, next) {
  var type = req.body.type;
  var like_id = req.session.user._id;
  var master_id = req.body.id;

  Like.unlikeThis(type, like_id, master_id, function() {
    res.json({status: 'success'});
    return
  })

};