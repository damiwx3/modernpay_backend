module.exports = (sequelize, DataTypes) => {
  const PayoutOrder = sequelize.define('PayoutOrder', {
    cycleId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    groupId: { // ✅ Add this field
      type: DataTypes.INTEGER,
      allowNull: true
    },
    amount: DataTypes.FLOAT,
    paidAt: DataTypes.DATE,
    order: DataTypes.INTEGER,
    status: DataTypes.STRING
  });

  PayoutOrder.associate = function(models) {
    PayoutOrder.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId' });
    PayoutOrder.belongsTo(models.User, { foreignKey: 'userId', as: 'user' }); // <-- Use alias 'user'
    PayoutOrder.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
  };

  return PayoutOrder;
};