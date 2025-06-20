module.exports = (sequelize, DataTypes) => {
  const MissedContribution = sequelize.define('MissedContribution', {
    userId: DataTypes.INTEGER,
    cycleId: DataTypes.INTEGER,
    reason: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'missed'
    }
  });

  MissedContribution.associate = function(models) {
    MissedContribution.belongsTo(models.User, { foreignKey: 'userId' });
    MissedContribution.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId' });
  };

  return MissedContribution;
};
