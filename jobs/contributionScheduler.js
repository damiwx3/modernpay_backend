const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');

const getPayoutDate = (startDate, order, frequency) => {
  const date = new Date(startDate);
  if (frequency === 'weekly') date.setDate(date.getDate() + 7 * (order - 1));
  else if (frequency === 'biweekly') date.setDate(date.getDate() + 14 * (order - 1));
  else if (frequency === 'monthly') date.setMonth(date.getMonth() + (order - 1));
  else date.setDate(date.getDate() + 30 * (order - 1)); // default 30 days
  return date;
};

const scheduleContributions = () => {
  // Run daily at 1am
  cron.schedule('0 1 * * *', async () => {
    console.log('📆 Running Contribution Scheduler...');

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      let totalProcessed = 0;
      let totalAutoPaid = 0;
      let totalReminders = 0;

      const dueCycles = await db.ContributionCycle.findAll({
        where: { status: 'open' },
        include: [{ model: db.ContributionGroup }]
      });

      for (const cycle of dueCycles) {
        const group = cycle.ContributionGroup;
        const amount = parseFloat(group.amountPerMember) || 1000;
        const frequency = group.frequency || 'monthly';

        const payoutOrders = await db.PayoutOrder.findAll({
          where: { cycleId: cycle.id },
          order: [['order', 'ASC']]
        });

        for (const order of payoutOrders) {
          totalProcessed++;
          const member = await db.ContributionMember.findOne({ where: { userId: order.userId, groupId: group.id } });
          if (!member) continue;

          const payoutDate = getPayoutDate(cycle.startDate, order.order, frequency);
          const hoursSincePayout = (now - payoutDate) / (1000 * 60 * 60);

          // Only auto-deduct if 12 hours have passed since payout date
          if (hoursSincePayout < 12) continue;

          // Only process if payment not already made
          const existing = await db.ContributionPayment.findOne({
            where: { memberId: member.id, cycleId: cycle.id }
          });
          if (existing) continue;

          const user = await db.User.findByPk(member.userId);
          const wallet = await db.Wallet.findOne({ where: { userId: user.id } });

          let status = 'pending';

          if (wallet && parseFloat(wallet.balance) >= amount) {
            wallet.balance = parseFloat(wallet.balance) - amount;
            await wallet.save();

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
            if (user.phoneNumber) await sendSms(user.phoneNumber, msg);
            if (user.email) await sendEmail({ to: user.email, subject: 'Contribution Reminder', text: msg });

            totalReminders++;
            console.log(`📨 Reminder sent to ${user.email || user.phoneNumber}`);

            await db.MissedContribution.create({
              memberId: member.id,
              userId: user.id,
              cycleId: cycle.id,
              reason: 'Insufficient wallet balance',
              missedAt: new Date()
            });
          }

          await db.ContributionPayment.create({
            memberId: member.id,
            cycleId: cycle.id,
            amount,
            status,
            paidAt: status === 'paid' ? new Date() : null
          });

          console.log(`✅ Payment recorded: ${user.email} - ${status}`);
        }

        // For each payout order, check if payout date has arrived and payout not completed
        for (const order of payoutOrders) {
          const payoutDate = getPayoutDate(cycle.startDate, order.order, frequency);
          const hoursSincePayout = (now - payoutDate) / (1000 * 60 * 60);

          if (hoursSincePayout >= 0 && order.status !== 'completed') {
            // Check if all members have paid for this payout
            const paymentsCount = await db.ContributionPayment.count({
              where: { cycleId: cycle.id, status: 'paid' }
            });

            if (paymentsCount === payoutOrders.length) {
              // Calculate payout and deduct 2% platform fee
              const payoutAmount = amount * payoutOrders.length;
              const platformFee = payoutAmount * 0.02;
              const netPayout = payoutAmount - platformFee;

              const winnerWallet = await db.Wallet.findOne({ where: { userId: order.userId } });
              winnerWallet.balance = parseFloat(winnerWallet.balance) + netPayout;
              await winnerWallet.save();

              await db.Transaction.create({
                userId: order.userId,
                amount: netPayout,
                type: 'credit',
                description: `Payout for "${group.name}" (Order #${order.order})`
              });

              // Record platform fee
              if (db.PlatformFee) {
                await db.PlatformFee.create({
                  cycleId: cycle.id,
                  userId: order.userId,
                  amount: platformFee,
                  type: 'cycle',
                  collectedAt: new Date()
                });
              }

              // Mark payout as completed
              order.status = 'completed';
              order.paidAt = new Date();
              await order.save();

              const winnerUser = await db.User.findByPk(order.userId);
              await sendEmail({
                to: winnerUser.email,
                subject: '🎉 You received a payout!',
                text: `Hi ${winnerUser.fullName}, you’ve received ₦${netPayout} as payout for "${group.name}" (Order #${order.order}).`
              });

              console.log(`🏆 Payout of ₦${netPayout} credited to user ${order.userId} (2% platform fee deducted)`);
            }
          }
        }

        // Close cycle if all payouts are completed
        const allPaidOut = await db.PayoutOrder.count({
          where: { cycleId: cycle.id, status: { [Op.ne]: 'completed' } }
        });
        if (allPaidOut === 0) {
          cycle.status = 'closed';
          await cycle.save();
          console.log(`✅ Cycle #${cycle.cycleNumber} closed.`);
        }
      }

      console.log('✅ Contribution Scheduler completed.\n');

      const summary = `
📅 Contribution Report (${today})
------------------------------------------
✅ Total Users Processed: ${totalProcessed}
💸 Auto-Paid Successfully: ${totalAutoPaid}
📨 Reminders Sent: ${totalReminders}
      `;

      const adminEmails = ['admin@modernstarfilms.com', 'babaalawda@gmail.com'];
      for (const email of adminEmails) {
        await sendEmail({
          to: email,
          subject: 'Contribution Summary',
          text: summary
        });
      }

    } catch (err) {
      console.error('❌ Contribution Scheduler failed:', err.message);
    }
  });
};

module.exports = scheduleContributions;