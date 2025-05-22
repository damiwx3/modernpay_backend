require('dotenv').config();
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const maintenanceCheck = require('./middleware/maintenance.middleware');
const checkMaintenance = require('./middleware/checkMaintenance.middleware');
const maintenance = require('./middleware/maintenance.middleware');
const bankRoutes = require('./routes/bank.routes');
const kycRoutes = require('./routes/kyc.routes');
const userRoutes = require('./routes/user.routes');
const savingsRoutes = require('./routes/savings.routes');
const ticketRoutes = require('./routes/ticket.routes');
const walletRoutes = require('./routes/wallet.routes');
const contributionCycleRoutes = require('./routes/contribution_cycle.routes');
const auditRoutes = require('./routes/audit.routes');
const billRoutes = require('./routes/bill.routes');
const campaignRoutes = require('./routes/campaign.routes');
// ...existing code...
const contributionRoutes = require('./routes/contribution.routes');
const userContactRoutes = require('./routes/user_contact.routes');


app.use('/api/contacts', userContactRoutes);
app.use('/api/contributions', contributionRoutes);
// ...existing code...

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(maintenanceCheck);
app.use(maintenance);
app.use(checkMaintenance);
app.use('/api/campaigns', campaignRoutes);
// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/contribution-cycles', contributionCycleRoutes);
app.use('/api/audit', auditRoutes);

// Other modular routes
app.use('/api/webhooks', require('./routes/webhook.routes'));
app.use('/api/virtual-cards', require('./routes/virtual_card.routes'));
app.use('/api/system', require('./routes/system.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/bills', require('./routes/bill.routes'));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register modular routes (if you have grouped routes)
app.use('/api', routes);

// Default
app.get('/', (req, res) => res.send('🌍 API Running'));

// Catch 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error Handler
app.use(errorHandler);

module.exports = app;