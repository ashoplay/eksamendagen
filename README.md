# Joke Rating App

A web application that displays random jokes and allows users to rate them. Built with Node.js, Express, MongoDB, and EJS.

## Features

- Random jokes from the Official Joke API
- User authentication system
- Joke rating system (1-10)
- Average rating display for logged-in users
- Responsive design for both mobile and desktop
- MongoDB database for storing users, jokes, and ratings

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd joke-rating-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/joke_rating_db
SESSION_SECRET=your_secret_key_here
```

4. Make sure MongoDB is running on your system

5. Start the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Project Structure

```
joke-rating-app/
├── config/
│   └── database.js
├── models/
│   ├── User.js
│   └── Joke.js
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── views/
│   ├── layout.ejs
│   ├── jokes.ejs
│   ├── login.ejs
│   └── register.ejs
├── .env
├── .gitignore
├── app.js
├── package.json
└── README.md
```

## API Endpoints

- `GET /` - Redirects to jokes page
- `GET /jokes` - Display random joke
- `POST /rate-joke` - Submit a rating for a joke
- `GET /login` - Login page
- `POST /login` - Login submission
- `GET /register` - Registration page
- `POST /register` - Registration submission
- `GET /logout` - Logout user

## Environment Variables

- `PORT` - Port number for the server (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret key for session management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 