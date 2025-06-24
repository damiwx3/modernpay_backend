module.exports = (sequelize, DataTypes) => {
  const GroupIncome = sequelize.define('GroupIncome', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    cycleId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER }, // who paid the penalty
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // 'late', 'other'
    collectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'group_incomes',
    timestamps: false
  });

  GroupIncome.associate = models => {
    GroupIncome.belongsTo(models.ContributionGroup, { foreignKey: 'groupId', as: 'group' });
    GroupIncome.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId', as: 'cycle' });
    GroupIncome.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return GroupIncome;
};