// models/savings_goal.model.js
module.exports = (sequelize, DataTypes) => {
  const SavingsGoal = sequelize.define("SavingsGoal", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    targetAmount: { type: DataTypes.FLOAT, allowNull: false },
    savedAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    deadline: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'active' } // active, completed, cancelled
  });
  return SavingsGoal;
};
