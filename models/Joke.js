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
            ref: 'User',
            required: true
        },
        score: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
});

// Calculate average rating
jokeSchema.virtual('averageRating').get(function() {
    if (!this.ratings || this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((acc, rating) => acc + rating.score, 0);
    return sum / this.ratings.length;
});

// Add method to get rating stats
jokeSchema.methods.getRatingStats = function() {
    return {
        averageRating: this.averageRating,
        totalRatings: this.ratings.length
    };
};

// Make virtuals show up in JSON and Object
jokeSchema.set('toJSON', { virtuals: true });
jokeSchema.set('toObject', { virtuals: true });

const Joke = mongoose.model('Joke', jokeSchema);
module.exports = Joke; 