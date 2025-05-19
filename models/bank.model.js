module.exports = (sequelize, DataTypes) => {
  const Bank = sequelize.define('Bank', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    country: { type: DataTypes.STRING, defaultValue: 'NG' },
    currency: { type: DataTypes.STRING, defaultValue: 'NGN' },
  });

  return Bank;
};