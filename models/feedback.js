var mongoose = require('mongoose');

var FeedbackSchema = new mongoose.Schema({
  source_email: String,
  destination_email: String,
  feedback: String,
  trip_id: String 
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
