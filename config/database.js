const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/joke_rating_db';
        console.log('Kobler til database...');
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('MongoDB tilkoblet!');
    } catch (error) {
        console.error('MongoDB tilkoblingsfeil:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB; 