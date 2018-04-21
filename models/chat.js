var mongoose = require('mongoose');

var chatSchema = new mongoose.Schema({
  user_id: String,
  user_name: String,
  chat: {
    user_name:  String,
    message:    String
  }
});

module.exports = mongoose.model('chat', chatSchema);
