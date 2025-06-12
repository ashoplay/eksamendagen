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
const Rating = require('./models/Rating');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/joke_rating_db'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
});

app.use(sessionMiddleware);

// Make user data available to all templates
app.use((req, res, next) => {
    res.locals.isAuthenticated = !!req.session.userId;
    next();
});

// Socket.IO middleware to access session
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected');

    // Join a room for each joke the user is viewing
    socket.on('join joke room', (jokeId) => {
        socket.join(`joke_${jokeId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        req.user = { _id: req.session.userId };
        next();
    } else {
        res.redirect('/login');
    }
};

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
        
        let isFavorite = false;
        let userRating = null;
        
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);
            isFavorite = user.favorites.includes(joke._id);
            const ratingObj = joke.ratings.find(r => r.user.toString() === req.session.userId);
            userRating = ratingObj ? ratingObj.score : null;
        }

        const ratingStats = joke.getRatingStats();

        res.render('jokes', { 
            joke,
            userRating,
            isFavorite,
            averageRating: ratingStats.averageRating,
            totalRatings: ratingStats.totalRatings,
            title: 'Random Joke'
        });
    } catch (error) {
        console.error('Error fetching joke:', error);
        res.render('jokes', { 
            error: 'Failed to fetch joke', 
            title: 'Error',
            userRating: null,
            isFavorite: false,
            averageRating: 0,
            totalRatings: 0
        });
    }
});

app.post('/rate-joke', isAuthenticated, async (req, res) => {
    try {
        const { jokeId, rating } = req.body;
        console.log('Behandler vurdering:', { jokeId, rating, userId: req.user._id });
        
        // Valider vurdering
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ 
                success: false, 
                error: 'Vurdering må være mellom 1 og 5' 
            });
        }

        // Finn eller opprett vurdering
        let ratingDoc = await Rating.findOne({ 
            jokeId: jokeId, 
            userId: req.user._id 
        });

        if (ratingDoc) {
            ratingDoc.rating = ratingNum;
        } else {
            ratingDoc = new Rating({
                jokeId: jokeId,
                userId: req.user._id,
                rating: ratingNum
            });
        }

        await ratingDoc.save();
        
        // Beregn ny gjennomsnittsvurdering
        const ratings = await Rating.find({ jokeId });
        const totalRatings = ratings.length;
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

        // Send oppdatering til alle klienter som ser denne vitsen
        io.to(`joke_${jokeId}`).emit('rating update', {
            jokeId,
            averageRating,
            totalRatings
        });

        res.json({ 
            success: true, 
            averageRating,
            totalRatings
        });
    } catch (error) {
        console.error('Feil ved vurdering:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Kunne ikke lagre vurdering',
            details: error.message 
        });
    }
});

app.post('/toggle-favorite', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Please login to save favorites' });
    }

    try {
        const { jokeId } = req.body;
        const user = await User.findById(req.session.userId);
        
        const favoriteIndex = user.favorites.indexOf(jokeId);
        if (favoriteIndex === -1) {
            user.favorites.push(jokeId);
        } else {
            user.favorites.splice(favoriteIndex, 1);
        }
        
        await user.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update favorites' });
    }
});

app.get('/favorites', isAuthenticated, async (req, res) => {
    try {
        // Hent brukerens favoritter med vitseinformasjon
        const user = await User.findById(req.user._id).populate('favorites');
        const favorites = user.favorites || [];

        // Hent vurderingsdata for hver vits
        const favoritesWithRatings = await Promise.all(favorites.map(async (joke) => {
            const ratings = await Rating.find({ jokeId: joke._id });
            const totalRatings = ratings.length;
            const averageRating = totalRatings > 0
                ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
                : null;
            
            return {
                ...joke.toObject(),
                totalRatings,
                averageRating
            };
        }));

        res.render('favorites', {
            title: 'Mine favoritter',
            favorites: favoritesWithRatings,
            isAuthenticated: true
        });
    } catch (error) {
        console.error('Feil ved henting av favoritter:', error);
        res.render('favorites', {
            title: 'Mine favoritter',
            error: 'Kunne ikke hente favoritter. Vennligst prøv igjen senere.',
            favorites: [],
            isAuthenticated: true
        });
    }
});

// FAQ route
app.get('/faq', (req, res) => {
    res.render('faq', {
        title: 'Ofte stilte spørsmål',
        isAuthenticated: !!req.session.userId
    });
});

// Update server creation
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 