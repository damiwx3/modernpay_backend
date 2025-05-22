module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define("AuditLog", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    action: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    ipAddress: { type: DataTypes.STRING },
    userAgent: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'success' }, // success, failed, etc.
    method: { type: DataTypes.STRING }, // HTTP method (GET, POST, etc.)
    endpoint: { type: DataTypes.STRING }, // API endpoint path
    metadata: { type: DataTypes.JSON }, // Any extra data as JSON
  }, {
    timestamps: true // adds createdAt and updatedAt automatically
  });
  return AuditLog;
};