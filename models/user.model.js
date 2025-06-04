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
    kycLevel: { type: DataTypes.INTEGER, defaultValue: 1 }, // For tiered KYC
    bvn: { type: DataTypes.STRING },                        // For BVN storage
    address: { type: DataTypes.STRING },                    // For address
    selfieUrl: { type: DataTypes.STRING },                  // For selfie
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    transactionPin: { type: DataTypes.STRING, allowNull: true },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    faceIdEnabled: { type: DataTypes.BOOLEAN, defaultValue: false } // <-- Add this line
  });
  return User;
};
