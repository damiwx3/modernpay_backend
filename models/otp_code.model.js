module.exports = (sequelize, DataTypes) => {
  const OTPCode = sequelize.define("OTPCode", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // e.g., "login", "transaction", "password_reset"
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 },              // NEW
    blockedUntil: { type: DataTypes.DATE, allowNull: true },             // NEW
  });

  return OTPCode;
};