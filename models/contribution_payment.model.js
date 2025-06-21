module.exports = (sequelize, DataTypes) => {
  const ContributionPayment = sequelize.define('ContributionPayment', {
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cycleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Optional, for direct user reference
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    penalty: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  });

  ContributionPayment.associate = models => {
    ContributionPayment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
ContributionPayment.belongsTo(models.ContributionMember, { foreignKey: 'memberId' });
ContributionPayment.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId' });
  };

  return ContributionPayment;
};