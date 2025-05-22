const db = require('../models');

const seedSettings = async () => {
  try {
    await db.SystemSetting.bulkCreate([
      { key: 'maintenance_mode', value: 'off', description: 'Enable or disable app-wide maintenance mode' },
      { key: 'transaction_fee', value: '1.5', description: 'Percentage fee applied to transfers' },
      { key: 'referral_bonus', value: '500', description: 'Amount rewarded for successful referral' },
      { key: 'support_email', value: 'support@modernpay.com', description: 'Support contact email' },
    ]);
    console.log('✅ Default settings seeded.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  }
};

seedSettings();