module.exports = (sequelize, DataTypes) => {
  const ContributionContact = sequelize.define('ContributionContact', {
    userId: DataTypes.INTEGER,
    contactUserId: DataTypes.INTEGER,
    addedAt: DataTypes.DATE
  });
  return ContributionContact;
};