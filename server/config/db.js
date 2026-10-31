const mongoose = require('Mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Mongoose Connection Error: ${error.message}`);
        throw error; // Passes the error up to server.js safely
    }
};

// 🛠️ THIS LINE IS THE CRUCIAL FIX:
module.exports = { connectDB };
