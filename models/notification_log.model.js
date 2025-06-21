module.exports = (sequelize, DataTypes) => {
  const NotificationLog = sequelize.define('NotificationLog', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    channel: {
      type: DataTypes.ENUM('email', 'sms', 'push'),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'sent',
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    timestamps: true
  });

  return NotificationLog;
};