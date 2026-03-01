const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Handle graceful disconnection
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed gracefully.');
  process.exit(0);
});

module.exports = connectDB;