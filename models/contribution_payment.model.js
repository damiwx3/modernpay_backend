module.exports = (sequelize, DataTypes) => {
  const ContributionPayment = sequelize.define('ContributionPayment', {
    memberId: DataTypes.INTEGER,
    cycleId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    amount: DataTypes.FLOAT,
    status: DataTypes.STRING,
    paidAt: DataTypes.DATE,
    txRef: DataTypes.STRING,
    isAutoPaid: DataTypes.BOOLEAN
  });

  ContributionPayment.associate = function(models) {
    ContributionPayment.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId' });
    ContributionPayment.belongsTo(models.ContributionMember, { foreignKey: 'memberId' });
  };

  return ContributionPayment;
};
