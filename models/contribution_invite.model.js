module.exports = (sequelize, DataTypes) => {
  const ContributionInvite = sequelize.define('ContributionInvite', {
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    invitedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable for email invites
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // For inviting by email
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    invitedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  ContributionInvite.associate = models => {
    ContributionInvite.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
    ContributionInvite.belongsTo(models.User, { foreignKey: 'invitedBy', as: 'Inviter' });
    ContributionInvite.belongsTo(models.User, { foreignKey: 'invitedUserId', as: 'Invitee' });
  };

  return ContributionInvite;
};