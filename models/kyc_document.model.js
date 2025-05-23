module.exports = (sequelize, DataTypes) => {
  const KYCDocument = sequelize.define("KYCDocument", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    documentType: { type: DataTypes.STRING, allowNull: false }, // e.g., 'ID card', 'utility bill'
    documentUrl: { type: DataTypes.STRING, allowNull: false },  // file path or URL
    status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, approved, rejected
    submittedAt: { type: DataTypes.DATE }, // optional
    rejectionReason: { type: DataTypes.STRING } // optional
  }, {
    timestamps: true
  });

  KYCDocument.associate = (models) => {
    KYCDocument.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return KYCDocument;
};
