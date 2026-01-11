import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material'
import { Check, Close } from '@mui/icons-material'
import { apiRequest } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const BeneficiaryValidation = () => {
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchPendingBeneficiaries()
  }, [])

  const fetchPendingBeneficiaries = async () => {
    try {
      setError(null)
      // Use secretary/beneficiaries endpoint or residents?
      // secretaryRoutes has /beneficiaries which returns vulnerable residents
      const response = await apiRequest('secretary/beneficiaries')
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setResidents([])
        setError(data?.error || `Failed to load beneficiaries (HTTP ${response.status})`)
        return
      }

      const normalizedResidents = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : []

      setResidents(normalizedResidents)
    } catch (error) {
      console.error('Error fetching beneficiaries:', error)
      setResidents([])
      setError(error?.message || 'Failed to load beneficiaries')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (id, status) => {
    try {
      setError(null)
      const response = await apiRequest(`secretary/beneficiaries/${id}/validate`, {
        method: 'POST',
        body: { status }
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.error || `Validation failed (HTTP ${response.status})`)
        return
      }
      fetchPendingBeneficiaries()
    } catch (e) {
      setError(e?.message || 'Validation failed')
    }
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Beneficiary Validation
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Review and validate benefit eligibility claims (PWD, Senior Citizen, Solo Parent, 4Ps, etc.).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status Claimed</TableCell>
              <TableCell>Vulnerability Score</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(residents) && residents.map((resident) => (
              <TableRow key={resident.Resident_ID}>
                <TableCell>{`${resident.First_Name} ${resident.Last_Name}`}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!!resident.Is_PWD && <Chip label="PWD" color="warning" size="small" />}
                    {!!resident.Is_Senior && <Chip label="Senior" color="info" size="small" />}
                    {!!resident.Is_Solo_Parent && <Chip label="Solo Parent" color="secondary" size="small" />}
                  </Box>
                </TableCell>
                <TableCell>{resident.Vulnerability_Score || 0}</TableCell>
                <TableCell>
                  <Button
                    startIcon={<Check />}
                    color="success"
                    size="small"
                    onClick={() => handleValidate(resident.Resident_ID, 'approved')}
                    sx={{ mr: 1 }}
                  >
                    Approve
                  </Button>
                  <Button
                    startIcon={<Close />}
                    color="error"
                    size="small"
                    onClick={() => handleValidate(resident.Resident_ID, 'rejected')}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {residents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No pending validations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default BeneficiaryValidation
