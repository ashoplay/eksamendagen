const mongoose = require('mongoose');

const jokeSchema = new mongoose.Schema({
    setup: {
        type: String,
        required: true
    },
    punchline: {
        type: String,
        required: true
    },
    externalId: {
        type: String,
        required: true,
        unique: true
    },
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: {
            type: Number,
            min: 1,
            max: 10
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
});

jokeSchema.virtual('averageRating').get(function() {
    if (this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((acc, rating) => acc + rating.score, 0);
    return (sum / this.ratings.length).toFixed(1);
});

const Joke = mongoose.model('Joke', jokeSchema);
module.exports = Joke; 