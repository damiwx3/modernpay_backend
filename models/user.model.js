module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: true },
    kycStatus: {
      type: DataTypes.ENUM('unverified', 'pending', 'approved', 'rejected'),
      defaultValue: 'unverified'
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  });
  return User;
};
