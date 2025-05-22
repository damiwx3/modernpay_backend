module.exports = (sequelize, DataTypes) => {
  const Campaign = sequelize.define("Campaign", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    reward: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Add this
    type: { type: DataTypes.STRING }, // Add this (e.g., 'cashback', 'referral', 'loyalty')
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE }
  });
  return Campaign;
};