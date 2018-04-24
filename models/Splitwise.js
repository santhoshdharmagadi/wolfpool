var mongoose = require('mongoose');

var splitwiseSchema = new mongoose.Schema({
    trip_id: String,
    total: Number,
    paid_by: String,
    splits: [{
        email: String,
        owes: Number
    }]
});

module.exports = mongoose.model('splitwise', splitwiseSchema);
