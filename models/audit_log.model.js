module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define("AuditLog", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    action: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    ipAddress: { type: DataTypes.STRING },
    userAgent: { type: DataTypes.STRING }
  });
  return AuditLog;
};
