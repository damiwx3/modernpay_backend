module.exports = (sequelize, DataTypes) => {
  const ContributionCycle = sequelize.define('ContributionCycle', {
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cycleNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      allowNull: false,
      defaultValue: 'open'
    }
  }, {
    timestamps: true
  });

  ContributionCycle.associate = function(models) {
    ContributionCycle.belongsTo(models.ContributionGroup, { foreignKey: 'groupId' });
    ContributionCycle.hasMany(models.ContributionPayment, { foreignKey: 'cycleId' });
    ContributionCycle.hasMany(models.MissedContribution, { foreignKey: 'cycleId' });
    ContributionCycle.hasMany(models.ContributionMember, { foreignKey: 'cycleId', as: 'members' });

  };

  return ContributionCycle;
};