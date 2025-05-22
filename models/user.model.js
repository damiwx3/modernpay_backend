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
    address: { type: DataTypes.STRING },                    // For address (Tier 4)
    selfieUrl: { type: DataTypes.STRING },                  // For selfie (Tier 4)
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  });
  return User;
};