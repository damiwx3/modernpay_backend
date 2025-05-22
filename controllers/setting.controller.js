const db = require('../models');

exports.getAllSettings = async (req, res) => {
  try {
    const settings = await db.SystemSetting.findAll();
    res.status(200).json({ settings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load settings', error: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  const { key, value } = req.body;

  try {
    const setting = await db.SystemSetting.findOne({ where: { key } });
    if (!setting) return res.status(404).json({ message: 'Setting not found' });

    setting.value = value;
    await setting.save();

    res.status(200).json({ message: 'Setting updated', setting });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};