module.exports = (sequelize, DataTypes) => {
  const ContributionSetting = sequelize.define('ContributionSetting', {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    notifications: { type: DataTypes.BOOLEAN, defaultValue: true },
    autoPay: { type: DataTypes.BOOLEAN, defaultValue: false },
    reminderFrequency: { type: DataTypes.STRING, defaultValue: 'Weekly' }
  });
  ContributionSetting.associate = models => {
    ContributionSetting.belongsTo(models.User, { foreignKey: 'userId' });
  };
  return ContributionSetting;
};