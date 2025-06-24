module.exports = (sequelize, DataTypes) => {
  const GroupWallet = sequelize.define('GroupWallet', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    balance: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'group_wallets',
    timestamps: false
  });

  GroupWallet.associate = models => {
    GroupWallet.belongsTo(models.ContributionGroup, { foreignKey: 'groupId', as: 'group' });
  };

  return GroupWallet;
};