module.exports = (sequelize, DataTypes) => {
  const ContributionMember = sequelize.define('ContributionMember', {
    groupId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    isAdmin: DataTypes.BOOLEAN,
    joinedAt: DataTypes.DATE,
    cycleId: DataTypes.INTEGER // Make sure this field exists in your model and DB
  });

  ContributionMember.associate = function(models) {
    ContributionMember.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
    ContributionMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    ContributionMember.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId', as: 'cycle' }); // <-- Add this line
  };

  return ContributionMember;
};