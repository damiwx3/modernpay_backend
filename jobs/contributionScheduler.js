const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');

/**
 * Runs every day at midnight
 */
const scheduleContributions = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('📆 Running Contribution Scheduler...');

    try {
      const today = new Date().toISOString().split('T')[0];
      let totalProcessed = 0;
      let totalAutoPaid = 0;
      let totalReminders = 0;

      // Fetch all active cycles due today
      const dueCycles = await db.ContributionCycle.findAll({
        where: {
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today }
        },
        include: [{ model: db.ContributionGroup }]
      });

      for (const cycle of dueCycles) {
        const group = cycle.ContributionGroup;
        const amount = parseFloat(group.amountPerMember) || 1000;

        console.log(`🔄 Group: ${group.name} (Cycle #${cycle.cycleNumber})`);

        const members = await db.ContributionMember.findAll({ where: { groupId: group.id } });

        for (const member of members) {
          totalProcessed++;

          const existing = await db.ContributionPayment.findOne({
            where: { memberId: member.id, cycleId: cycle.id }
          });

          if (!existing) {
            const user = await db.User.findByPk(member.userId);
            const wallet = await db.Wallet.findOne({ where: { userId: user.id } });

            let status = 'pending';

            if (wallet && parseFloat(wallet.balance) >= amount) {
              // Deduct from wallet
              wallet.balance = parseFloat(wallet.balance) - amount;
              await wallet.save();

              // Log transaction
              await db.Transaction.create({
                userId: user.id,
                amount,
                type: 'debit',
                description: `Contribution for "${group.name}" (Cycle #${cycle.cycleNumber})`
              });

              status = 'paid';
              totalAutoPaid++;

              console.log(`💸 ₦${amount} auto-deducted and logged for ${user.email}`);
            } else {
              const msg = `Hi ${user.fullName}, your ₦${amount} contribution for "${group.name}" is pending.`;

              // Send SMS
              if (user.phoneNumber) {
                await sendSms(user.phoneNumber, msg);
              }

              // Send Email
              if (user.email) {
                await sendEmail({
                  to: user.email,
                  subject: 'Contribution Reminder',
                  text: msg
                });
              }

              totalReminders++;
              console.log(`📨 Reminder sent to ${user.email || user.phoneNumber}`);
            }

            // Record payment status
            await db.ContributionPayment.create({
              memberId: member.id,
              cycleId: cycle.id,
              amount,
              status,
              paidAt: status === 'paid' ? new Date() : null
            });

            console.log(`✅ Payment recorded: ${user.email} - ${status}`);
          }
        }

        // --- Payout Logic ---
        // After all members processed, check if all have paid
        const paidMembers = await db.ContributionPayment.count({
          where: { cycleId: cycle.id, status: 'paid' }
        });

        console.log('cycle.cycleNumber:', cycle.cycleNumber);
        console.log('members.length:', members.length);

        if (
          cycle.cycleNumber &&
          members.length > 0 &&
          paidMembers === members.length
        ) {
          // Determine winner (e.g., by cycle number order)
          const winnerIndex = (cycle.cycleNumber - 1) % members.length;
          const winner = members[winnerIndex];

          const winnerWallet = await db.Wallet.findOne({ where: { userId: winner.userId } });
          const payoutAmount = amount * members.length;
          winnerWallet.balance = parseFloat(winnerWallet.balance) + payoutAmount;
          await winnerWallet.save();

          // Log payout transaction
          await db.Transaction.create({
            userId: winner.userId,
            amount: payoutAmount,
            type: 'credit',
            description: `Payout for "${group.name}" (Cycle #${cycle.cycleNumber})`
          });

          // Mark cycle as closed
          cycle.status = 'closed';
          await cycle.save();

          console.log(`🏆 Payout of ₦${payoutAmount} credited to user ${winner.userId}`);
        }
        // --- End Payout Logic ---
      }

      console.log('✅ Contribution Scheduler completed.\n');

      // Admin summary
      const summary = `
📅 Daily Contribution Report (${today})
------------------------------------------
✅ Total Users Processed: ${totalProcessed}
💸 Auto-Paid Successfully: ${totalAutoPaid}
📨 Reminders Sent: ${totalReminders}
      `;

      const adminEmails = ['admin@modernstarfilms.com', 'babaalawda@gmail.com'];
      for (const email of adminEmails) {
        await sendEmail({
          to: email,
          subject: 'Daily Contribution Summary',
          text: summary
        });
      }

    } catch (err) {
      console.error('❌ Contribution Scheduler failed:', err.message);
    }
  });
};

module.exports = scheduleContributions;
