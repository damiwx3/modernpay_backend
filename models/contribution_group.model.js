module.exports = (sequelize, DataTypes) => {
  const ContributionGroup = sequelize.define("ContributionGroup", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    maxMembers: { type: DataTypes.INTEGER, defaultValue: 10 },
    status: { type: DataTypes.STRING, defaultValue: 'active' }
  });
  return ContributionGroup;
};
