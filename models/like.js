var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var LikeSchema = new Schema({
  like_id: { type: ObjectId }, // 点赞的id
  master_id: { type: ObjectId }, //topic id or reply id
  type: { type: String },
  create_at: { type: Date, default: Date.now },
});

LikeSchema.plugin(BaseModel);
LikeSchema.index({create_at: -1});

mongoose.model('Like', LikeSchema);
