const mongoose = require('mongoose');

const getHealth = () => ({
    status: 'OK',
    database: mongoose.connection.readyState === 1
        ? 'Connected'
        : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
});

module.exports = { getHealth };