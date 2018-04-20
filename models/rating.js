var mongoose = require('mongoose');

var RatingSchema = new mongoose.Schema({
  source_email: String,
  destination_email: String,
  rating: Number,
  trip_id: String 
});

module.exports = mongoose.model('Rating', RatingSchema);
