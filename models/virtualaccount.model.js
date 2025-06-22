module.exports = (sequelize, DataTypes) => {
  const VirtualAccount = sequelize.define('VirtualAccount', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bankId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paystackCustomerCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paystackAccountId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    raw: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    provider: { // <-- Add this field
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'paystack'
    }
  }, {
    tableName: 'VirtualAccounts',
    timestamps: true
  });

  VirtualAccount.associate = (models) => {
    VirtualAccount.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return VirtualAccount;
};