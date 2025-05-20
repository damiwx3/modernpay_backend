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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(maintenanceCheck);
app.use(maintenance);
app.use(checkMaintenance); // <-- Add this line before loading routes

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register modular routes
app.use('/api', routes);

// Default
app.get('/', (req, res) => res.send('🌍 API Running'));

// Catch 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use('/api/webhooks', require('./routes/webhook.routes'));
app.use('/api/virtual-cards', require('./routes/virtual_card.routes'));
app.use('/api/system', require('./routes/system.routes'));
app.use('/api/wallets', require('./routes/wallet.routes')); // <-- Added line
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/bills', require('./routes/bill.routes'));
const bankRoutes = require('./routes/bank.route');
app.use('/api/bank', bankRoutes);

// Error Handler
app.use(errorHandler);

module.exports = app;
