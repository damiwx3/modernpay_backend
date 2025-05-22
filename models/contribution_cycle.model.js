module.exports = (sequelize, DataTypes) => {
  const ContributionCycle = sequelize.define("ContributionCycle", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    cycleNumber: { type: DataTypes.INTEGER },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE }
  });
  return ContributionCycle;
};
