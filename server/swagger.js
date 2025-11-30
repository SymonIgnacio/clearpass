const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Barangay Management System API',
    version: '1.0.0',
    description: 'Comprehensive API for Barangay Management System with AI-powered decision support',
    contact: {
      name: 'Barangay Management Team',
      email: 'admin@barangay.gov.ph'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.barangay.gov.ph',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Resident: {
        type: 'object',
        required: ['first_name', 'last_name', 'sitio_id'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique resident identifier'
          },
          first_name: {
            type: 'string',
            description: 'Resident first name'
          },
          last_name: {
            type: 'string',
            description: 'Resident last name'
          },
          middle_name: {
            type: 'string',
            description: 'Resident middle name'
          },
          age: {
            type: 'integer',
            description: 'Resident age'
          },
          gender: {
            type: 'string',
            enum: ['Male', 'Female', 'Other'],
            description: 'Resident gender'
          },
          sitio_id: {
            type: 'integer',
            description: 'Sitio identifier'
          },
          sitio_name: {
            type: 'string',
            description: 'Sitio name'
          },
          is_senior: {
            type: 'boolean',
            description: 'Senior citizen status'
          },
          is_pwd: {
            type: 'boolean',
            description: 'Person with disability status'
          },
          is_single_parent: {
            type: 'boolean',
            description: 'Single parent status'
          },
          employment_status: {
            type: 'string',
            description: 'Employment status'
          },
          monthly_income: {
            type: 'number',
            description: 'Monthly income'
          }
        }
      },
      Certificate: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Certificate identifier'
          },
          control_no: {
            type: 'string',
            description: 'Certificate control number'
          },
          resident_id: {
            type: 'integer',
            description: 'Associated resident ID'
          },
          certificate_type: {
            type: 'string',
            description: 'Type of certificate'
          },
          purpose: {
            type: 'string',
            description: 'Purpose of certificate issuance'
          },
          status: {
            type: 'string',
            enum: ['approved', 'pending', 'rejected'],
            description: 'Certificate status'
          },
          date_issued: {
            type: 'string',
            format: 'date',
            description: 'Date of issuance'
          }
        }
      },
      BlotterCase: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Blotter case identifier'
          },
          case_number: {
            type: 'string',
            description: 'Unique case number'
          },
          incident_type: {
            type: 'string',
            description: 'Type of incident'
          },
          complainant_name: {
            type: 'string',
            description: 'Complainant name'
          },
          respondent_name: {
            type: 'string',
            description: 'Respondent name'
          },
          status: {
            type: 'string',
            enum: ['Pending', 'Forwarded to Lupon', 'Resolved', 'Dismissed'],
            description: 'Case status'
          },
          severity: {
            type: 'string',
            enum: ['Low', 'Medium', 'High', 'Critical'],
            description: 'Incident severity'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp'
          },
          path: {
            type: 'string',
            description: 'Request path'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    },
    {
      apiKeyAuth: []
    }
  ]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: ['./server/index.js'] // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
