module.exports = (sequelize, DataTypes) => {
  const KYCDocument = sequelize.define("KYCDocument", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: { type: DataTypes.INTEGER, allowNull: false },

    documentType: { type: DataTypes.STRING, allowNull: false }, // e.g. 'nin', 'bvn', 'dl'

    documentNumber: { type: DataTypes.STRING, allowNull: false }, // e.g. NIN number

    documentUrl: { type: DataTypes.STRING }, // Optional: For passport, utility bill, etc.

    selfieUrl: { type: DataTypes.STRING }, // Optional: For face match

    faceMatchScore: { type: DataTypes.FLOAT }, // e.g., 95.5%

    status: {
      type: DataTypes.STRING,
      defaultValue: "pending", // 'pending', 'approved', 'rejected', 'in_review'
    },

    submittedAt: { type: DataTypes.DATE },

    rejectionReason: { type: DataTypes.STRING },

    externalReferenceId: { type: DataTypes.STRING }, // YouVerify ref

    kycApiResponse: { type: DataTypes.JSON }, // Full JSON response for logs

  }, {
    timestamps: true,
  });

  KYCDocument.associate = (models) => {
    KYCDocument.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return KYCDocument;
};