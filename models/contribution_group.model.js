module.exports = (sequelize, DataTypes) => {
  const ContributionGroup = sequelize.define('ContributionGroup', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    amountPerMember: DataTypes.FLOAT,
    frequency: DataTypes.STRING,
    payoutSchedule: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    maxMembers: DataTypes.INTEGER,
    status: DataTypes.STRING,
    isPublic: DataTypes.BOOLEAN,
    payoutOrderType: DataTypes.STRING
  });

  ContributionGroup.associate = function(models) {
    ContributionGroup.hasMany(models.ContributionCycle, { foreignKey: 'groupId' });
    ContributionGroup.hasMany(models.ContributionMember, { foreignKey: 'groupId' });
  };

  return ContributionGroup;
};
