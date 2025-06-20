const db = require('../models');

// User creates a support ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }

    const ticket = await db.Ticket.create({
      userId: req.user.id,
      subject,
      message,
      priority: priority || 'normal',
      status: 'open'
    });

    res.status(201).json({ message: 'Ticket submitted', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create ticket', error: err.message });
  }
};

// User views their own tickets
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await db.Ticket.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ tickets });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tickets', error: err.message });
  }
};

// User views a single ticket
exports.getUserTicketById = async (req, res) => {
  try {
    const ticket = await db.Ticket.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.status(200).json({ ticket });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch ticket', error: err.message });
  }
};

// Admin views all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await db.Ticket.findAll({
      include: [{ model: db.User, attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ tickets });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all tickets', error: err.message });
  }
};

// Admin responds to a ticket
exports.respondToTicket = async (req, res) => {
  const { id } = req.params;
  const { response, status } = req.body;

  try {
    const ticket = await db.Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.message += `\n\n[ADMIN RESPONSE]: ${response}`;
    if (status) ticket.status = status;

    await ticket.save();
    res.status(200).json({ message: 'Ticket updated', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Failed to respond to ticket', error: err.message });
  }
};

// User closes their ticket
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await db.Ticket.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'closed';
    await ticket.save();
    res.status(200).json({ message: 'Ticket closed', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Failed to close ticket', error: err.message });
  }
};

// Admin deletes a ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await db.Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await ticket.destroy();
    res.status(200).json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete ticket', error: err.message });
  }
};