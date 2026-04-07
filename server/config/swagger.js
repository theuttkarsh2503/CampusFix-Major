const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "CampusFix Lite API",
    version: "1.0.0",
    description: "Complaint and service request management API",
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
      description: "Local server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Auth" },
    { name: "Complaints" },
    { name: "Dashboard" },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
