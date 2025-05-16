require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// === Rate Limiting (Security) ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === Swagger Documentation ===
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === Modular Routes (Only this is needed)
const routes = require('./routes'); // auto loads all subroutes inside index.js
app.use('/api', routes);

// === Root Route
app.get('/', (req, res) => {
  res.send('🌍 ModernPay Backend API is running.');
});

// === 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// === Global Error Handler
app.use(errorHandler);

module.exports = app;
