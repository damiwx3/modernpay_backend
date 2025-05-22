module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define("Loan", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    interestRate: { type: DataTypes.FLOAT, allowNull: false },
    durationInMonths: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    approvedAt: { type: DataTypes.DATE }
  });
  return Loan;
};
