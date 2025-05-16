module.exports = (sequelize, DataTypes) => {
  const Campaign = sequelize.define("Campaign", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE }
  });
  return Campaign;
};
