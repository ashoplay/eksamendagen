const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_-]+$/.test(v);
            },
            message: 'Username can only contain letters, numbers, underscores, and hyphens'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Joke'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Update last login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    return this.save();
};

// Static method to authenticate user
userSchema.statics.authenticate = async function(username, password) {
    try {
        const user = await this.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid password');
        }
        
        await user.updateLastLogin();
        return user;
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 