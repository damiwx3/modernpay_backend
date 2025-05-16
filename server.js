// Load environment variables
require('dotenv').config();

// App setup
const app = require('./app');
const db = require('./models');
const startContributionJob = require('./jobs/contributionScheduler');

// Set port
const PORT = process.env.PORT || 5000;

// Start server + DB connection
const startServer = async () => {
  try {
    // 1. Test DB connection
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // 2. Sync models (adjust { alter: true } if needed during development)
    await db.sequelize.sync();
    console.log('🔁 Models synchronized.');

    // 3. Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });

    // 4. Start background cron jobs (daily contributions, etc.)
    startContributionJob();

  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1); // Exit app if something critical fails
  }
};

startServer();
