
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

    // ✅ Auto-sync DB tables with model changes (safe for dev)
    await db.sequelize.sync({ alter: true });
    console.log('🔁 Models synchronized with { alter: true }.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });

    // ⏰ Start contribution background job
    startContributionJob();

  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
