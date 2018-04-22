var mongoose = require('mongoose');

var chatSchema = new mongoose.Schema({
  trip_id: String,
  chat: [{
    user_email:  String,
    message:    String
  }]
});

module.exports = mongoose.model('chat', chatSchema);
