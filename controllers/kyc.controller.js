// Tier 1: Phone number and selfie verification (NGN 200,000 limit)
exports.verifyPhoneAndSelfie = async (req, res) => {
  // Implement phone number and selfie verification logic here
  // After successful verification:
  await db.User.update(
    { kycLevel: 1 },
    { where: { id: req.user.id } }
  );
  res.status(200).json({ message: 'Tier 1 unlocked (phone & selfie verified)' });
};

// Tier 2: NIN/BVN, ID, and address verification (NGN 5,000,000 limit)
exports.verifyBvnOrNinAndAddress = async (req, res) => {
  // Implement NIN/BVN, ID, and address verification logic here
  // After successful verification:
  await db.User.update(
    { kycLevel: 2 },
    { where: { id: req.user.id } }
  );
  res.status(200).json({ message: 'Tier 2 unlocked (NIN/BVN, ID, address verified)' });
};

// Tier 4: Utility bill verification (Unlimited)
exports.verifyUtilityBill = async (req, res) => {
  // Implement utility bill verification logic here
  // After successful verification:
  await db.User.update(
    { kycLevel: 4 },
    { where: { id: req.user.id } }
  );
  res.status(200).json({ message: 'Tier 4 unlocked (utility bill verified)' });
};
