const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Passport middleware
app.use(passport.initialize());

// Passport Config
require('./config/passport')(passport);

// Serve static assets in production
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/notes', require('./routes/api/notes'));
app.use('/api/images', require('./routes/api/images'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
