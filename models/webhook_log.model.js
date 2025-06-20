module.exports = (sequelize, DataTypes) => {
  const WebhookLog = sequelize.define('WebhookLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    event: { type: DataTypes.STRING, allowNull: false },
    reference: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true },
    payload: { type: DataTypes.JSONB, allowNull: false },
    receivedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    },
    notificationSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    processingStatus: { type: DataTypes.STRING, defaultValue: 'received' },
    errorMessage: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'WebhookLogs',
    timestamps: true,
    indexes: [
      { fields: ['reference'] },
      { fields: ['event'] },
      { fields: ['userId'] }
    ]
  });

  return WebhookLog;
};