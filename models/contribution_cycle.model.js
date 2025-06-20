module.exports = (sequelize, DataTypes) => {
  const ContributionCycle = sequelize.define('ContributionCycle', {
    groupId: DataTypes.INTEGER,
    cycleNumber: DataTypes.INTEGER,
    startDate: DataTypes.DATEONLY,
    endDate: DataTypes.DATEONLY,
    amount: DataTypes.FLOAT,
    status: DataTypes.STRING
  });

  ContributionCycle.associate = function(models) {
    ContributionCycle.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
    ContributionCycle.hasMany(models.ContributionPayment, { foreignKey: 'cycleId' });
    ContributionCycle.hasMany(models.MissedContribution, { foreignKey: 'cycleId' });
  };

  return ContributionCycle;
};
