module.exports = (sequelize, DataTypes) => {
  const ServiceLog = sequelize.define("ServiceLog", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    action: { type: DataTypes.STRING },
    serviceType: { type: DataTypes.STRING }, // e.g. airtime, data, transfer
    status: { type: DataTypes.STRING, defaultValue: 'success' },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });
  return ServiceLog;
};
