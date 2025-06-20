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
    deviceToken: { type: DataTypes.STRING, allowNull: true },
    
    // ✅ Add this field
    method: { type: DataTypes.STRING, allowNull: true }, // login method: e.g., 'google', 'email'

    kycStatus: {
      type: DataTypes.ENUM('unverified', 'pending', 'approved', 'rejected'),
      defaultValue: 'unverified'
    },
    kycLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
    kycLimit: { type: DataTypes.BIGINT, allowNull: true },
    bvn: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    selfieUrl: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    transactionPin: { type: DataTypes.STRING, allowNull: true },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    faceIdEnabled: { type: DataTypes.BOOLEAN, defaultValue: false }
  });

  return User;
};