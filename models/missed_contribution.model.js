module.exports = (sequelize, DataTypes) => {
  const MissedContribution = sequelize.define('MissedContribution', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true },
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: { 
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cycleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    missedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  MissedContribution.associate = models => {
    MissedContribution.belongsTo(models.ContributionMember, { foreignKey: 'memberId' });
    MissedContribution.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId' });
    MissedContribution.belongsTo(models.User, { foreignKey: 'userId' }); // <-- Add this
  };

  return MissedContribution;
};