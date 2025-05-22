const swaggerJSDoc = require('swagger-jsdoc');

// Swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ModernPay API Documentation',
    version: '1.0.0',
    description: 'This is the full backend API documentation for the ModernPay Fintech App.',
  },
  servers: [
    {
      url: 'http://localhost:5000', // Change to your deployed server URL
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    }
  },
  security: [
    {
      bearerAuth: [],
    },
  ]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // ✅ this scans for comments in all route files
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;