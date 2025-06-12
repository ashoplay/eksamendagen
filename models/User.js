const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Joke'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash passordet før lagring
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Metode for å sammenligne passord
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Feil ved passordsammenligning');
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 