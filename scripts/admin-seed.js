require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');
const sendEmail = require('../utils/sendEmail'); // ✅ include this

async function seedAdmin() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Connected to DB');

    const existing = await db.AdminUser.findOne({ where: { email: 'admin@modernpay.com' } });
    if (existing) {
      console.log('⚠️ Admin already exists.');
      return;
    }

    const password = 'Admin1234';
    const hashed = await bcrypt.hash(password, 10);

    const admin = await db.AdminUser.create({
      fullName: 'System Admin',
      username: 'admin',
      email: 'admin@modernpay.com',
      password: hashed
    });

    console.log('✅ Admin seeded:');
    console.log('   Email:    admin@modernpay.com');
    console.log('   Password: Admin1234');
    console.log('   Username: admin');

    // ✅ Send email
    const message = `
Hi ${admin.fullName},

Your admin account has been created.

Login details:
Email: ${admin.email}
Password: ${password}

Login at: https://yourdomain.com/admin-login

-- ModernPay Admin System
    `;

    await sendEmail(admin.email, 'Your Admin Account is Ready', message);

  } catch (err) {
    console.error('❌ Failed to seed admin:', err.message);
  } finally {
    await db.sequelize.close();
  }
}

seedAdmin();
