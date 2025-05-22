module.exports = (sequelize, DataTypes) => {
  const ContributionInvite = sequelize.define("ContributionInvite", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    invitedBy: { type: DataTypes.INTEGER, allowNull: false }, // userId of inviter
    invitedUserId: { type: DataTypes.INTEGER, allowNull: false }, // userId of invitee
    status: { type: DataTypes.STRING, defaultValue: 'pending' } // pending, accepted, declined
  });
  ContributionInvite.associate = (models) => {
    ContributionInvite.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
    ContributionInvite.belongsTo(models.User, { as: 'Inviter', foreignKey: 'invitedBy' });
    ContributionInvite.belongsTo(models.User, { as: 'Invitee', foreignKey: 'invitedUserId' });
  };
  return ContributionInvite;
};