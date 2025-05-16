module.exports = (sequelize, DataTypes) => {
  const ContributionCycle = sequelize.define('ContributionCycle', {
    // Define model fields here
  }, {
    tableName: 'contribution_cycle',
    timestamps: true
  });

  return ContributionCycle;
};
