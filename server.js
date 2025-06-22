// server.js
require('dotenv').config();

const app = require('./app');
const db = require('./models');
const startContributionJob = require('./jobs/contributionScheduler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    await db.sequelize.sync({ alter: true });
    console.log('🔁 Models synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });

    // Start background jobs (like daily payouts, contributions, etc.)
    startContributionJob();

  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
