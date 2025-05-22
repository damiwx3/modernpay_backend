// models/security_log.model.js

module.exports = (sequelize, DataTypes) => {
  const SecurityLog = sequelize.define('SecurityLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    ipAddress: { type: DataTypes.STRING },
    device: { type: DataTypes.STRING },
    action: { type: DataTypes.STRING },
  });

  return SecurityLog;
};