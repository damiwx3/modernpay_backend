require('dotenv').config();

const app = require('./app');
const db = require('./models');
const startContributionJob = require('./jobs/contributionScheduler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Safe for development: use alter in dev, no change in production
    const isDev = process.env.NODE_ENV !== 'production';
    await db.sequelize.sync(isDev ? { alter: true } : {});
    console.log('🔁 Models synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });

    // Start daily contribution job
    startContributionJob();

  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
