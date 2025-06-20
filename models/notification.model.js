module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define("Notification", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    data: { type: DataTypes.JSONB, allowNull: true }, // <-- Add this line
    read: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    timestamps: true
  });
  return Notification;
};