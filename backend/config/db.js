const mongoose = require('mongoose');

/**
 * connectDB - Primary connection for the Portfolio database
 */
const connectDB = async () => {
  try {
    const portfolioConn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Portfolio DB connected: ${portfolioConn.connection.host}`);
  } catch (error) {
    console.error(`❌ Portfolio DB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Handle graceful disconnection for both connections
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  if (global.jsArenaConn) {
    await global.jsArenaConn.close();
    console.log('JSArena connection closed.');
  }
  console.log('MongoDB connections closed gracefully.');
  process.exit(0);
});

module.exports = connectDB;