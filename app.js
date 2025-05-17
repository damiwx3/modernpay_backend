require('dotenv').config();
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register modular routes
app.use('/api', routes);

// Default
app.get('/', (req, res) => res.send('🌍 API Running'));

// Catch 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use('/api/webhooks', require('./routes/webhook.routes'));
app.use('/api/bank', require('./routes/bank.routes'));
app.use('/api/virtual-cards', require('./routes/virtual_card.routes'));


// Error Handler
app.use(errorHandler);

module.exports = app;
