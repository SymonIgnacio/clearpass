const request = require('supertest')
const mysql = require('mysql2/promise')
const axios = require('axios')

// Mock dependencies
jest.mock('mysql2/promise')
jest.mock('axios')

// Import after mocking
const app = require('./index')

// Mock database connection
const mockDb = {
  execute: jest.fn()
}
mysql.createPool.mockReturnValue(mockDb)

// Mock axios
axios.post = jest.fn()

describe('Barangay Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('service', 'Barangay Management API')
    })
  })

  describe('Resident Endpoints', () => {
    const mockResident = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      middle_name: 'M',
      age: 30,
      gender: 'Male',
      sitio_name: 'Batia Proper',
      is_senior: false,
      is_pwd: true,
      is_single_parent: false
    }

    describe('GET /api/residents', () => {
      it('should return all residents', async () => {
        mockDb.execute.mockResolvedValueOnce([ [mockResident] ])

        const response = await request(app).get('/api/residents')

        expect(response.status).toBe(200)
        expect(response.body).toEqual([mockResident])
        expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT r.*, s.name as sitio_name FROM residents r'))
      })

      it('should handle database errors', async () => {
        mockDb.execute.mockRejectedValueOnce(new Error('Database error'))

        const response = await request(app).get('/api/residents')

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error', 'Failed to fetch residents')
      })
    })

    describe('GET /api/residents/:id', () => {
      it('should return resident by id', async () => {
        mockDb.execute.mockResolvedValueOnce([ [mockResident] ])

        const response = await request(app).get('/api/residents/1')

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockResident)
      })

      it('should return 404 for non-existent resident', async () => {
        mockDb.execute.mockResolvedValueOnce([ [] ])

        const response = await request(app).get('/api/residents/999')

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Resident not found')
      })
    })

    describe('POST /api/residents', () => {
      const newResident = {
        first_name: 'Jane',
        last_name: 'Smith',
        age: 25,
        gender: 'Female',
        sitio_id: 1
      }

      it('should create new resident', async () => {
        mockDb.execute
          .mockResolvedValueOnce([ [{ id: 1 }] ]) // sitio check
          .mockResolvedValueOnce([ { insertId: 2 } ])

        const response = await request(app)
          .post('/api/residents')
          .send(newResident)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id', 2)
        expect(response.body).toHaveProperty('message', 'Resident created successfully')
      })

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/residents')
          .send({ age: 25 }) // Missing required fields

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'First name and last name are required')
      })

      it('should validate sitio existence', async () => {
        mockDb.execute.mockResolvedValueOnce([ [] ]) // sitio not found

        const response = await request(app)
          .post('/api/residents')
          .send({ first_name: 'Jane', last_name: 'Smith', sitio_id: 999 })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Invalid sitio_id - sitio does not exist')
      })
    })

    describe('PUT /api/residents/:id', () => {
      const updateData = {
        first_name: 'Jane',
        last_name: 'Updated',
        age: 26
      }

      it('should update resident', async () => {
        mockDb.execute.mockResolvedValueOnce([])

        const response = await request(app)
          .put('/api/residents/1')
          .send(updateData)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Resident updated successfully')
      })
    })

    describe('DELETE /api/residents/:id', () => {
      it('should delete resident', async () => {
        mockDb.execute.mockResolvedValueOnce([])

        const response = await request(app).delete('/api/residents/1')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Resident deleted successfully')
      })
    })
  })

  describe('Census Endpoints', () => {
    const mockCensusData = [
      { sitio_name: 'Batia Proper', total_residents: 500, seniors: 40, pwd: 15 },
      { sitio_name: 'Northville 5', total_residents: 300, seniors: 25, pwd: 10 }
    ]

    const mockOverall = [{ total_residents: 800, total_seniors: 65, total_pwd: 25 }]

    describe('GET /api/census', () => {
      it('should return census statistics', async () => {
        mockDb.execute
          .mockResolvedValueOnce([ mockCensusData ])
          .mockResolvedValueOnce([ mockOverall ])

        const response = await request(app).get('/api/census')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('bySitio', mockCensusData)
        expect(response.body).toHaveProperty('overall', mockOverall[0])
      })
    })
  })

  describe('Blotter Endpoints', () => {
    const mockBlotterCase = {
      id: 1,
      case_number: 'BLOT-2025-001',
      incident_type: 'Theft',
      complainant_name: 'John Doe',
      status: 'Pending'
    }

    describe('GET /api/blotter', () => {
      it('should return all blotter cases', async () => {
        mockDb.execute.mockResolvedValueOnce([ [mockBlotterCase] ])

        const response = await request(app).get('/api/blotter')

        expect(response.status).toBe(200)
        expect(response.body).toEqual([mockBlotterCase])
      })
    })

    describe('POST /api/blotter', () => {
      const newBlotterCase = {
        complainant_name: 'John Doe',
        incident_type: 'Theft',
        location: 'Test Location',
        sitio_id: 1,
        description: 'Test incident'
      }

      it('should create new blotter case', async () => {
        mockDb.execute.mockResolvedValueOnce([ { insertId: 1 } ])

        const response = await request(app)
          .post('/api/blotter')
          .send(newBlotterCase)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id', 1)
        expect(response.body).toHaveProperty('case_number')
        expect(response.body).toHaveProperty('message', 'Blotter record created successfully')
      })
    })

    describe('PUT /api/blotter/:id', () => {
      const updateData = {
        status: 'Resolved',
        resolution: 'Case resolved'
      }

      it('should update blotter case', async () => {
        mockDb.execute.mockResolvedValueOnce([])

        const response = await request(app)
          .put('/api/blotter/1')
          .send(updateData)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Blotter record updated successfully')
      })
    })

    describe('DELETE /api/blotter/:id', () => {
      it('should delete blotter case', async () => {
        mockDb.execute.mockResolvedValueOnce([])

        const response = await request(app).delete('/api/blotter/1')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Blotter record deleted successfully')
      })
    })
  })

  describe('Certificate Endpoints', () => {
    const mockCertificate = {
      id: 1,
      certificate_number: 'CERT-2025-001',
      resident_name: 'John Doe',
      certificate_type: 'Barangay Clearance',
      status: 'Active'
    }

    describe('GET /api/certificates', () => {
      it('should return all certificates', async () => {
        mockDb.execute.mockResolvedValueOnce([ [mockCertificate] ])

        const response = await request(app).get('/api/certificates')

        expect(response.status).toBe(200)
        expect(response.body).toEqual([mockCertificate])
      })
    })

    describe('POST /api/certificates', () => {
      const newCertificate = {
        resident_id: 1,
        certificate_type_id: 4,
        purpose: 'Employment'
      }

      it('should issue certificate successfully', async () => {
        // Mock blotter check (no active cases)
        mockDb.execute
          .mockResolvedValueOnce([ [{ active_cases: 0 }] ])
          .mockResolvedValueOnce([ { insertId: 1 } ])

        const response = await request(app)
          .post('/api/certificates')
          .send(newCertificate)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id', 1)
        expect(response.body).toHaveProperty('control_no')
        expect(response.body).toHaveProperty('message', 'Certificate issued successfully')
      })

      it('should block certificate issuance for resident with active blotter', async () => {
        // Mock blotter check (has active cases)
        mockDb.execute.mockResolvedValueOnce([ [{
          active_cases: 1,
          case_numbers: 'BLOT-2025-001',
          incident_types: 'Theft'
        }] ])

        const response = await request(app)
          .post('/api/certificates')
          .send({ ...newCertificate, certificate_type_id: 4 }) // Barangay Clearance

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'BLOCK ISSUANCE: Active blotter case found for this resident')
        expect(response.body.details).toHaveProperty('activeCases', 1)
      })
    })
  })

  describe('AI Integration Endpoints', () => {
    describe('POST /api/ai/priority', () => {
      const mockResident = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        income_estimate: 8000,
        is_senior: false,
        is_pwd: true,
        is_single_parent: false,
        employment_status: 'Employed'
      }

      const mockAIResponse = {
        data: {
          priority: 'HIGH',
          score: 85,
          reasons: ['Person with Disability (PWD)', 'Low income (< ₱10,000/month)']
        }
      }

      it('should return AI priority analysis', async () => {
        mockDb.execute.mockResolvedValueOnce([ [mockResident] ])
        axios.post.mockResolvedValueOnce(mockAIResponse)

        const response = await request(app)
          .post('/api/ai/priority')
          .send({ resident_id: 1 })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('resident_id', 1)
        expect(response.body).toHaveProperty('resident_name', 'John Doe')
        expect(response.body).toHaveProperty('priority', 'HIGH')
        expect(response.body).toHaveProperty('score', 85)
      })

      it('should handle resident not found', async () => {
        mockDb.execute.mockResolvedValueOnce([ [] ])

        const response = await request(app)
          .post('/api/ai/priority')
          .send({ resident_id: 999 })

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Resident not found')
      })

      it('should handle AI service error', async () => {
        mockDb.execute.mockResolvedValueOnce([ [mockResident] ])
        axios.post.mockRejectedValueOnce(new Error('AI service unavailable'))

        const response = await request(app)
          .post('/api/ai/priority')
          .send({ resident_id: 1 })

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error', 'AI service unavailable')
      })
    })

    describe('GET /api/ai/patrol-suggestions', () => {
      const mockBlotterData = [
        { id: 1, sitio_name: 'Batia Proper', incident_type: 'Theft', severity: 'High' }
      ]

      const mockAIResponse = {
        data: {
          overall_risk_level: 'HIGH',
          patrol_suggestions: {
            'Batia Proper': {
              risk_level: 'High',
              patrol_suggestion: 'Deploy 4 Tanods + Roving Patrol'
            }
          }
        }
      }

      it('should return AI patrol suggestions', async () => {
        mockDb.execute.mockResolvedValueOnce([ mockBlotterData ])
        axios.post.mockResolvedValueOnce(mockAIResponse)

        const response = await request(app).get('/api/ai/patrol-suggestions')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('overall_risk_level', 'HIGH')
        expect(response.body).toHaveProperty('patrol_suggestions')
      })
    })
  })

  describe('QR Code Endpoints', () => {
    describe('GET /verify-qr/:hash', () => {
      it('should verify valid certificate QR', async () => {
        const mockCertificate = {
          control_no: 'CERT-2025-001',
          certificate_type: 'Barangay Clearance',
          resident_name: 'John Doe',
          sitio_name: 'Batia Proper',
          date_issued: '2025-01-15',
          signatory_captain: 'Captain Juan',
          signatory_secretary: 'Secretary Maria'
        }

        mockDb.execute.mockResolvedValueOnce([ [mockCertificate] ])

        const response = await request(app).get('/verify-qr/ABC123')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('status', 'VALID')
        expect(response.body).toHaveProperty('type', 'certificate')
        expect(response.body.certificate).toHaveProperty('number', 'CERT-2025-001')
      })

      it('should return invalid for non-existent QR', async () => {
        mockDb.execute
          .mockResolvedValueOnce([ [] ]) // No certificate
          .mockResolvedValueOnce([ [] ]) // No resident

        const response = await request(app).get('/verify-qr/INVALID')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('status', 'INVALID')
        expect(response.body).toHaveProperty('message', 'QR code not found or invalid. This document may be counterfeit.')
      })
    })
  })

  describe('Utility Endpoints', () => {
    describe('GET /api/sitios', () => {
      it('should return all sitios', async () => {
        const mockSitios = [
          { id: 1, name: 'Batia Proper' },
          { id: 2, name: 'Northville 5' }
        ]

        mockDb.execute.mockResolvedValueOnce([ mockSitios ])

        const response = await request(app).get('/api/sitios')

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockSitios)
      })
    })

    describe('GET /api/certificate-types', () => {
      it('should return certificate types', async () => {
        const response = await request(app).get('/api/certificate-types')

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body)).toBe(true)
        expect(response.body.length).toBeGreaterThan(0)
        expect(response.body[0]).toHaveProperty('name')
        expect(response.body[0]).toHaveProperty('fee')
        expect(response.body[0]).toHaveProperty('validity_days')
      })
    })
  })
})
