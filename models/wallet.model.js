module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define("Wallet", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    accountNumber: {
      type: DataTypes.STRING,
      unique: true
    },
    bankName: {
      type: DataTypes.STRING,
      defaultValue: 'ModernPay Bank'
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    dailyLimit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    monthlyLimit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'Wallets',
    timestamps: true // adds createdAt and updatedAt
  });

  Wallet.associate = (models) => {
    Wallet.belongsTo(models.User, { foreignKey: 'userId' });
    Wallet.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Wallet;
};
