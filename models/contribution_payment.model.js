module.exports = (sequelize, DataTypes) => {
  const ContributionPayment = sequelize.define("ContributionPayment", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    cycleId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paidAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
  });
  return ContributionPayment;
};
