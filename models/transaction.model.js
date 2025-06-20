module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // credit or debit
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    description: { type: DataTypes.STRING },
    reference: { type: DataTypes.STRING, unique: true },
    status: { type: DataTypes.STRING, defaultValue: 'success' },
    category: { type: DataTypes.STRING },
    senderName: { type: DataTypes.STRING },           // <-- Add
    senderAccountNumber: { type: DataTypes.STRING },  // <-- Add
    recipientName: { type: DataTypes.STRING },        // <-- Add
    recipientAccount: { type: DataTypes.STRING },     // <-- Add
    bankName: { type: DataTypes.STRING },             // <-- Optional, for bank transfers
  });
  return Transaction;
};