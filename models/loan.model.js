module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define("Loan", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    interestRate: { type: DataTypes.FLOAT, allowNull: false },
    durationInMonths: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    approvedAt: { type: DataTypes.DATE },
    repaymentAmount: { type: DataTypes.DECIMAL(12, 2) }, // total to repay
    repaidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 }, // how much has been repaid
    nextRepaymentDate: { type: DataTypes.DATE }, // next scheduled repayment
    isAutoPayment: { type: DataTypes.BOOLEAN, defaultValue: false } // auto-debit flag
  }, {
    timestamps: true
  });

  Loan.associate = (models) => {
    Loan.belongsTo(models.User, { foreignKey: 'userId' });
    // You can add Loan.hasMany(models.LoanRepayment, ...) if you want a repayment history table
  };

  return Loan;
};