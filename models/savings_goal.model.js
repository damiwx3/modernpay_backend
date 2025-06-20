module.exports = (sequelize, DataTypes) => {
  const SavingsGoal = sequelize.define("SavingsGoal", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    targetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    savedAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    deadline: { type: DataTypes.DATE, allowNull: true },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    timestamps: true
  });

  SavingsGoal.associate = (models) => {
    SavingsGoal.belongsTo(models.User, { foreignKey: 'userId' });
    // Optionally: SavingsGoal.hasMany(models.SavingsTransaction, { foreignKey: 'goalId' });
  };

  return SavingsGoal;
};