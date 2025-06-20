module.exports = (sequelize, DataTypes) => {
  const TransactionDispute = sequelize.define("TransactionDispute", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    transactionId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
  }, {
    timestamps: true // adds createdAt and updatedAt
  });

  TransactionDispute.associate = (models) => {
    TransactionDispute.belongsTo(models.User, { foreignKey: 'userId' });
    TransactionDispute.belongsTo(models.Transaction, { foreignKey: 'transactionId' });
  };

  return TransactionDispute;
};