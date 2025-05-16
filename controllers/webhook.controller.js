const db = require('../models');
const crypto = require('crypto');

exports.handleFlutterwaveWebhook = async (req, res) => {
  // Verify Flutterwave Signature
  const hash = crypto.createHmac('sha256', process.env.FLW_SECRET_HASH)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['verif-hash']) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.data;

  try {
    if (event === 'transfer.completed') {
      const { reference, status, amount, destination } = payload;

      const transaction = await db.Transaction.findOne({ where: { description: { [db.Sequelize.Op.like]: `%${reference}%` } } });

      if (transaction) {
        transaction.status = status === 'SUCCESSFUL' ? 'success' : 'failed';
        await transaction.save();

        console.log(`✅ Transfer status updated: ${reference} → ${transaction.status}`);
      }
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).send('Error processing webhook');
  }
};
