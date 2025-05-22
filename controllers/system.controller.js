const db = require('../models');

exports.setMaintenanceMode = async (req, res) => {
  const { mode } = req.body; // expect 'on' or 'off'

  if (!['on', 'off'].includes(mode)) {
    return res.status(400).json({ message: 'Invalid mode. Use "on" or "off".' });
  }

  try {
    const [setting, created] = await db.SystemSetting.findOrCreate({
      where: { key: 'maintenance_mode' },
      defaults: { value: mode }
    });

    if (!created) {
      setting.value = mode;
      await setting.save();
    }

    res.status(200).json({ message: `Maintenance mode set to "${mode}".` }); // <-- Fixed: use backticks for template literal
  } catch (err) {
    res.status(500).json({ message: 'Failed to set maintenance mode', error: err.message });
  }
};