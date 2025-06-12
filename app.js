require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fetch = require('node-fetch');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/User');
const Joke = require('./models/Joke');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/joke_rating_db'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Make user data available to all templates
app.use((req, res, next) => {
    res.locals.isAuthenticated = !!req.session.userId;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.redirect('/jokes');
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
    try {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        await user.save();
        req.session.userId = user._id;
        res.redirect('/jokes');
    } catch (error) {
        res.render('register', { error: 'Username already taken', title: 'Register' });
    }
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (user && await user.comparePassword(req.body.password)) {
            req.session.userId = user._id;
            res.redirect('/jokes');
        } else {
            res.render('login', { error: 'Invalid username or password', title: 'Login' });
        }
    } catch (error) {
        res.render('login', { error: 'An error occurred', title: 'Login' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/jokes');
});

app.get('/jokes', async (req, res) => {
    try {
        const response = await fetch('https://official-joke-api.appspot.com/random_joke');
        const jokeData = await response.json();
        
        let joke = await Joke.findOne({ externalId: jokeData.id });
        if (!joke) {
            joke = new Joke({
                setup: jokeData.setup,
                punchline: jokeData.punchline,
                externalId: jokeData.id
            });
            await joke.save();
        }
        
        const userRating = req.session.userId ? 
            joke.ratings.find(r => r.user.toString() === req.session.userId) : null;

        res.render('jokes', { 
            joke,
            userRating: userRating ? userRating.score : null,
            title: 'Random Joke'
        });
    } catch (error) {
        res.render('jokes', { error: 'Failed to fetch joke', title: 'Error' });
    }
});

app.post('/rate-joke', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Please login to rate jokes' });
    }

    try {
        const { jokeId, rating } = req.body;
        const joke = await Joke.findById(jokeId);
        
        const existingRatingIndex = joke.ratings.findIndex(r => 
            r.user.toString() === req.session.userId
        );

        if (existingRatingIndex > -1) {
            joke.ratings[existingRatingIndex].score = rating;
        } else {
            joke.ratings.push({
                user: req.session.userId,
                score: rating
            });
        }
        
        await joke.save();
        res.json({ 
            success: true, 
            averageRating: joke.averageRating 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to save rating' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 