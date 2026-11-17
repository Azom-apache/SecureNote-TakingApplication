const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', (req, res) => {
    res.status(404).json({
        message: 'Not found'
    });
});

module.exports = app;
