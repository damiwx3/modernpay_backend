module.exports = (sequelize, DataTypes) => {
  const VirtualCard = sequelize.define("VirtualCard", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    cardNumber: { type: DataTypes.STRING, allowNull: false },
    cardHolder: { type: DataTypes.STRING, allowNull: false },
    expiryDate: { type: DataTypes.STRING, allowNull: false }, // MM/YY format
    cvv: { type: DataTypes.STRING, allowNull: false },
    provider: { type: DataTypes.STRING, defaultValue: 'Visa' },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 }, // <-- add this
    spendingLimit: { type: DataTypes.DECIMAL(12, 2), allowNull: true } // <-- add this
  });
  return VirtualCard;
};