const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    jokeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Joke',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indeks for raskere spørringer
ratingSchema.index({ jokeId: 1, userId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating; 