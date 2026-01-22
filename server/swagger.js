const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ClearPass Barangay Management System API',
      version: '1.0.0',
      description:
        'Comprehensive API documentation for ClearPass - A digital management system for Philippine barangays',
      contact: {
        name: 'ClearPass Development Team',
        email: 'support@clearpass.local',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://clearpass.local/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Resident: {
          type: 'object',
          properties: {
            Resident_ID: {
              type: 'string',
              example: 'RES-1234567890-A1B2',
            },
            First_Name: {
              type: 'string',
              example: 'Juan',
            },
            Last_Name: {
              type: 'string',
              example: 'Dela Cruz',
            },
            Mobile_Number: {
              type: 'string',
              example: '09171234567',
            },
            Residency_Status: {
              type: 'string',
              enum: ['Active', 'Inactive', 'Temporary'],
            },
          },
        },
        Certificate: {
          type: 'object',
          properties: {
            control_no: {
              type: 'string',
              example: 'CLR-1234567890-A1B2C3D4',
            },
            resident_id: {
              type: 'string',
            },
            certificate_type: {
              type: 'string',
              example: 'Barangay Clearance',
            },
            purpose: {
              type: 'string',
              example: 'Employment',
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Approved', 'Released', 'Rejected'],
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Residents',
        description: 'Resident management operations',
      },
      {
        name: 'Certificates',
        description: 'Certificate issuance and management',
      },
      {
        name: 'Blotter',
        description: 'Incident reporting and case management',
      },
      {
        name: 'Census',
        description: 'Population statistics and analytics',
      },
      {
        name: 'Admin',
        description: 'Administrative operations and reports',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
