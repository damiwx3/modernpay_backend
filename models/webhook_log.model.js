module.exports = (sequelize, DataTypes) => {
  const WebhookLog = sequelize.define('WebhookLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    event: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    receivedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    userId: { // <-- Add this
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'WebhookLogs',
    timestamps: true // <-- Add this
  });

  return WebhookLog;
};
