const db = require('../models');
const ContributionCycle = db.ContributionCycle;

exports.getAllCycles = async (req, res) => {
  try {
    const cycles = await ContributionCycle.findAll();
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCycleById = async (req, res) => {
  try {
    const cycle = await ContributionCycle.findByPk(req.params.id);
    if (!cycle) return res.status(404).json({ error: 'Not found' });
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCycle = async (req, res) => {
  try {
    const cycle = await ContributionCycle.create(req.body);
    res.status(201).json(cycle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};