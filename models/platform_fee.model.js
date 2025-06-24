module.exports = (sequelize, DataTypes) => {
  const PlatformFee = sequelize.define('PlatformFee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cycleId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER }, // who paid the fee (nullable for cycle fee)
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // 'late', 'cycle', etc.
    collectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'platform_fees',
    timestamps: false
  });

  PlatformFee.associate = models => {
    PlatformFee.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId', as: 'cycle' });
    PlatformFee.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return PlatformFee;
};