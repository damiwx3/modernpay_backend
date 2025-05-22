module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define("Ticket", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'open' },
    priority: { type: DataTypes.STRING, defaultValue: 'normal' },
    adminResponse: { type: DataTypes.TEXT, allowNull: true },
  });

  Ticket.associate = function(models) {
    Ticket.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Ticket;
};