// app.js
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === Swagger Documentation ===
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/admin-auth', require('./routes/admin_auth.routes'));
app.use('/api/admin-dashboard', require('./routes/admin_dashboard.routes'));
app.use('/api/admin-kyc', require('./routes/admin_kyc.routes'));
app.use('/api/notify', require('./routes/notify.routes'));
app.use('/api/system', require('./routes/system.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));





// === Modular Routes ===
const routes = require('./routes'); // loads routes/index.js
app.use('/api', routes);

// === Root Route ===
app.get('/', (req, res) => {
  res.send('🌍 ModernPay Backend API is running.');
});

// === 404 Handler ===
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// === Global Error Handler ===
app.use(errorHandler);

module.exports = app;
