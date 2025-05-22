const db = require('../models');

// Add a contact
exports.addContact = async (req, res) => {
  try {
    const { contactUserId } = req.body;
    const contact = await db.UserContact.create({
      userId: req.user.id,
      contactUserId
    });
    res.status(201).json({ message: 'Contact added', contact });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add contact', error: err.message });
  }
};

// List contacts
exports.getContacts = async (req, res) => {
  try {
    const contacts = await db.UserContact.findAll({
      where: { userId: req.user.id },
      include: [{ model: db.User, as: 'Contact', attributes: ['id', 'fullName', 'email'] }]
    });
    res.status(200).json({ contacts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch contacts', error: err.message });
  }
};

// Remove a contact
exports.removeContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const contact = await db.UserContact.findOne({
      where: { id: contactId, userId: req.user.id }
    });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    await contact.destroy();
    res.status(200).json({ message: 'Contact removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove contact', error: err.message });
  }
};