module.exports = (sequelize, DataTypes) => {
  const UserContact = sequelize.define("UserContact", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    contactUserId: { type: DataTypes.INTEGER, allowNull: false }
  });
  UserContact.associate = (models) => {
    UserContact.belongsTo(models.User, { as: 'Owner', foreignKey: 'userId' });
    UserContact.belongsTo(models.User, { as: 'Contact', foreignKey: 'contactUserId' });
  };
  return UserContact;
};