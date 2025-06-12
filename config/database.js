const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/joke_rating_db';
        console.log('Connecting to database...');
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });

        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully');
        });

        console.log('MongoDB connected successfully!');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
};

module.exports = connectDB; 