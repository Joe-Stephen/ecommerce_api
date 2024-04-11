const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const doc = {
  info: {
    version: "Ecommerce API", // by default: '1.0.0'
    title: "Progressing", // by default: 'REST API'
    description: "Ecommerce API project", // by default: ''
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "User Routes",
    },
    {
      url: "http://localhost:3000/admin",
      description: "Admin Routes",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./modules/router/*.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);
