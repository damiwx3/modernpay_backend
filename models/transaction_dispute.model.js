module.exports = (sequelize, DataTypes) => {
  const TransactionDispute = sequelize.define("TransactionDispute", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    transactionId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
  });
  return TransactionDispute;
};
