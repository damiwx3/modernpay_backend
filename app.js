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

// --- MIDDLEWARE: Place these at the very top, before any routes ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Maintenance and other middleware ---
app.use(maintenanceCheck);
app.use(maintenance);
app.use(checkMaintenance);

// --- ROUTES ---
// Only this line is needed for all your API routes:
app.use('/api', routes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Default
app.get('/', (req, res) => res.send('🌍 API Running'));

// Catch 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error Handler
app.use(errorHandler);

module.exports = app;
