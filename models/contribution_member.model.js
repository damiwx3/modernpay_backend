module.exports = (sequelize, DataTypes) => {
  const ContributionMember = sequelize.define('ContributionMember', {
    groupId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    isAdmin: DataTypes.BOOLEAN,
    joinedAt: DataTypes.DATE
  });

  ContributionMember.associate = function(models) {
    ContributionMember.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
    ContributionMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ContributionMember;
};
