const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test DB connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected.'))
  .catch(err => console.error('❌ DB connection error:', err));

// Initialize DB object
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Auto-load all models in this folder (excluding index.js)
const basename = path.basename(__filename);
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// ✅ Explicitly register AdminUser model
db.AdminUser = require('./admin_user.model')(sequelize, DataTypes);
db.BillPayment = require('./bill_payment.model.js')(sequelize, Sequelize.DataTypes);
db.VirtualAccount = require('./virtualaccount.model')(sequelize, DataTypes); // <-- ADD THIS LINE

db.NotificationLog = require('./notification_log.model')(sequelize, DataTypes);
db.NotificationLog.belongsTo(db.User, { foreignKey: 'userId' });
db.WebhookLog = require('./webhook_log.model')(sequelize, DataTypes);
const ContributionSetting = require('./contribution_setting.model.js')(sequelize, DataTypes);

db.ContributionSetting = ContributionSetting;

// ==========================
// ✅ Define Relationships Here
// ==========================

db.User.hasOne(db.Wallet, { foreignKey: 'userId' });
db.Wallet.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Transaction, { foreignKey: 'userId' });
db.Transaction.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.VirtualCard, { foreignKey: 'userId' });
db.VirtualCard.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.KYCDocument, { foreignKey: 'userId' });
db.KYCDocument.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Loan, { foreignKey: 'userId' });
db.Loan.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Notification, { foreignKey: 'userId' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.BillPayment, { foreignKey: 'userId' });
db.BillPayment.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.SavingsGoal, { foreignKey: 'userId' });
db.SavingsGoal.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.UserSession, { foreignKey: 'userId' });
db.UserSession.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.OTPCode, { foreignKey: 'userId' });
db.OTPCode.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Ticket, { foreignKey: 'userId' });
db.Ticket.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.ServiceLog, { foreignKey: 'userId' });
db.ServiceLog.belongsTo(db.User, { foreignKey: 'userId' });

// Contribution System Relationships
db.ContributionGroup.hasMany(db.ContributionCycle, { foreignKey: 'groupId' });
db.ContributionCycle.belongsTo(db.ContributionGroup, { foreignKey: 'groupId' });

db.ContributionGroup.hasMany(db.ContributionMember, { foreignKey: 'groupId' });
db.ContributionMember.belongsTo(db.ContributionGroup, { foreignKey: 'groupId' });

db.User.hasMany(db.ContributionMember, { foreignKey: 'userId' });
db.ContributionMember.belongsTo(db.User, { foreignKey: 'userId' });

db.ContributionCycle.hasMany(db.ContributionPayment, { foreignKey: 'cycleId' });
db.ContributionPayment.belongsTo(db.ContributionCycle, { foreignKey: 'cycleId' });

db.ContributionMember.hasMany(db.ContributionPayment, { foreignKey: 'memberId' });
db.ContributionPayment.belongsTo(db.ContributionMember, { foreignKey: 'memberId' });

db.ContributionCycle.hasMany(db.MissedContribution, { foreignKey: 'cycleId' });
db.MissedContribution.belongsTo(db.ContributionCycle, { foreignKey: 'cycleId' });

db.User.hasMany(db.MissedContribution, { foreignKey: 'userId' });
db.MissedContribution.belongsTo(db.User, { foreignKey: 'userId' });

db.PayoutOrder.belongsTo(db.ContributionCycle, { foreignKey: 'cycleId' });
db.PayoutOrder.belongsTo(db.User, { foreignKey: 'userId' });

db.Referral.belongsTo(db.User, { as: 'Referrer', foreignKey: 'referrerId' });
db.Referral.belongsTo(db.User, { as: 'Referred', foreignKey: 'referredId' });

db.TransactionDispute.belongsTo(db.Transaction, { foreignKey: 'transactionId' });
db.TransactionDispute.belongsTo(db.User, { foreignKey: 'userId' });

db.WebhookLog.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasMany(db.WebhookLog, { foreignKey: 'userId' });
db.KYCDocument = require('./kyc_document.model.js')(sequelize, Sequelize.DataTypes);

db.AuditLog.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasMany(db.KYCDocument, { foreignKey: 'userId' });
db.KYCDocument.belongsTo(db.User, { foreignKey: 'userId' });
db.SavingsGoal = require('./savings_goal.model.js')(sequelize, Sequelize.DataTypes);
db.User.hasMany(db.SavingsGoal, { foreignKey: 'userId' });
db.SavingsGoal.belongsTo(db.User, { foreignKey: 'userId' });


// ==========================

// Call associations if defined in models
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});



db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;