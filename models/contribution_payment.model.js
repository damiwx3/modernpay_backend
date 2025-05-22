module.exports = (sequelize, DataTypes) => {
  const ContributionPayment = sequelize.define("ContributionPayment", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    cycleId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paidAt: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
  });

  ContributionPayment.associate = (models) => {
    ContributionPayment.belongsTo(models.ContributionMember, { foreignKey: 'memberId' });
    ContributionPayment.belongsTo(models.ContributionCycle, { foreignKey: 'cycleId' });
  };

  return ContributionPayment;
};