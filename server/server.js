const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// 🛠️ FIXED: Added curly braces to properly destructure connectDB from your config file
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Test route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'MERN Backend is running!'
    });
});

// Start server after database connection
const startServer = async () => {
    try {
        // 🛠️ FIXED: Wrapped in try/catch to stop nodemon from crashing if MongoDB fails
        await connectDB();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ MongoDB Connection Error Details:');
        console.error(error.message || error);
        console.log('⚠️ Server failed to start due to database connection issue.');
    }
};

startServer();
