require('dotenv').config();
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const cors = require('cors');
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
const contributionRoutes = require('./routes/contribution.routes');
const userContactRoutes = require('./routes/user_contact.routes');
const disputeRoutes = require('./routes/dispute.routes');

// --- MIDDLEWARE: Place these at the very top, before any routes ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Maintenance and other middleware ---
app.use(maintenanceCheck);
app.use(maintenance);
app.use(checkMaintenance);


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
