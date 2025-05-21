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
const checkMaintenance = require('./middleware/checkMaintenance.middleware'); // <-- Add this line
const maintenance = require('./middleware/maintenance.middleware');
const bankRoutes = require('./routes/bank.routes');
const kycRoutes = require('./routes/kyc.routes');
const userRoutes = require('./routes/user.routes');
const savingsRoutes = require('./routes/savings.routes');

app.use('/api/savings', savingsRoutes);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(maintenanceCheck);
app.use(maintenance);
app.use(checkMaintenance); // <-- Add this line before loading routes
app.use('/api/users', userRoutes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register modular routes
app.use('/api', routes);

// Default
app.get('/', (req, res) => res.send('🌍 API Running'));


app.use('/api/webhooks', require('./routes/webhook.routes'));
//app.use('/api/bank', require('./routes/bank.routes'));
app.use('/api/virtual-cards', require('./routes/virtual_card.routes'));
app.use('/api/system', require('./routes/system.routes'));
app.use('/api/wallets', require('./routes/wallet.routes')); // <-- Added line
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/bills', require('./routes/bill.routes'));
app.use('/api/bank', bankRoutes);
app.use('/api/kyc', kycRoutes);

// Catch 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error Handler
app.use(errorHandler);

module.exports = app;
