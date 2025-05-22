module.exports = (sequelize, DataTypes) => {
  const ContributionMember = sequelize.define("ContributionMember", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    role: { type: DataTypes.STRING, defaultValue: 'member' }
  });

  ContributionMember.associate = (models) => {
    ContributionMember.belongsTo(models.User, { foreignKey: 'userId' });
    ContributionMember.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
    ContributionMember.hasMany(models.ContributionPayment, { foreignKey: 'memberId' });
  };

  return ContributionMember;
};