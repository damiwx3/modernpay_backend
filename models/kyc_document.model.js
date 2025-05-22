module.exports = (sequelize, DataTypes) => {
  const KYCDocument = sequelize.define('KYCDocument', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    documentUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    documentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    rejectionReason: {
      type: DataTypes.STRING,
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  KYCDocument.associate = function(models) {
    KYCDocument.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return KYCDocument;
};