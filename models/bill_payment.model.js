module.exports = (sequelize, DataTypes) => {
  const BillPayment = sequelize.define("BillPayment", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    serviceType: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    reference: { type: DataTypes.STRING, unique: true },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    customer: { type: DataTypes.STRING }, // e.g. phone, meter, smartcard, etc.
    responseData: { type: DataTypes.JSON }, // store VTpass response or extra info
    paidAt: { type: DataTypes.DATE } // when payment was completed
  });

  BillPayment.associate = (models) => {
    BillPayment.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return BillPayment;
};