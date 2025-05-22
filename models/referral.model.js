module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define("Referral", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    referrerId: { type: DataTypes.INTEGER, allowNull: false },
    referredId: { type: DataTypes.INTEGER, allowNull: false },
    bonusAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
  });
  return Referral;
};
