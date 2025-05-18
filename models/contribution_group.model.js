module.exports = (sequelize, DataTypes) => {
  const ContributionGroup = sequelize.define("ContributionGroup", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },

    createdBy: { type: DataTypes.INTEGER, allowNull: false }, // FK to users table
    maxMembers: { type: DataTypes.INTEGER, defaultValue: 10 },

    amountPerMember: { type: DataTypes.FLOAT, allowNull: false },
    frequency: { type: DataTypes.STRING }, // e.g., Daily, Weekly, Monthly
    payoutSchedule: { type: DataTypes.STRING }, // e.g., Monday or 15th
    imageUrl: { type: DataTypes.STRING }, // local path or cloud URL

    status: { type: DataTypes.STRING, defaultValue: 'active' }
  });

  return ContributionGroup;
};
