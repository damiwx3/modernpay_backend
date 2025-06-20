module.exports = (sequelize, DataTypes) => {
  const PayoutOrder = sequelize.define('PayoutOrder', {
    cycleId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    amount: DataTypes.FLOAT,
    paidAt: DataTypes.DATE,
    order: DataTypes.INTEGER,
    status: DataTypes.STRING
  });

  PayoutOrder.associate = function(models) {
    PayoutOrder.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId' });
    PayoutOrder.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return PayoutOrder;
};
