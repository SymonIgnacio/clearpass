import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Avatar,
  AvatarGroup,
  Alert
} from '@mui/material'
import { Add, Event, People, Edit, PersonAdd, Sms } from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const CommunityEvents = () => {
  const [events, setEvents] = useState([])
  const [residents, setResidents] = useState([])
  const [sitios, setSitios] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [participantsDialog, setParticipantsDialog] = useState(null)
  const [formData, setFormData] = useState({
    program_name: '',
    description: '',
    program_date: '',
    sitio_id: '',
    target_beneficiaries: [],
    status: 'Planned',
    organizer: '',
    budget_allocated: '',
    notes: ''
  })

  useEffect(() => {
    fetchEvents()
    fetchResidents()
    fetchSitios()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await apiRequest('programs')
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchResidents = async () => {
    try {
      const response = await apiRequest('residents?limit=50') // Limit for performance
      const data = await response.json()
      setResidents(data.data || []) // Handle paginated response
    } catch (error) {
      console.error('Error fetching residents:', error)
    }
  }

  const fetchSitios = async () => {
    try {
      const response = await apiRequest('sitios')
      const data = await response.json()
      setSitios(data)
    } catch (error) {
      console.error('Error fetching sitios:', error)
    }
  }

  const handleOpenDialog = (event = null) => {
    if (event) {
      setEditing(event)
      setFormData({
        program_name: event.program_name || '',
        description: event.description || '',
        program_date: event.program_date || '',
        sitio_id: event.sitio_id || '',
        target_beneficiaries: event.target_beneficiaries || [],
        status: event.status || 'Planned',
        organizer: event.organizer || '',
        budget_allocated: event.budget_allocated || '',
        notes: event.notes || ''
      })
    } else {
      setEditing(null)
      setFormData({
        program_name: '',
        description: '',
        program_date: '',
        sitio_id: '',
        target_beneficiaries: [],
        status: 'Planned',
        organizer: '',
        budget_allocated: '',
        notes: ''
      })
    }
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setEditing(null)
  }

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [smsDialog, setSmsDialog] = useState(null)
  const [smsMessage, setSmsMessage] = useState('')

  const handleSave = async () => {
    try {
      const response = editing
        ? await apiRequest(`programs/${editing.id}`, {
            method: 'PUT',
            body: formData
          })
        : await apiRequest('programs', {
            method: 'POST',
            body: formData
          })

      const result = await response.json()
      setSuccessMessage(editing ? 'Event updated successfully!' : 'Event created successfully!')
      fetchEvents()
      handleCloseDialog()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving event:', error)
      setErrorMessage('Failed to save event. Please try again.')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleAddParticipant = async (eventId, residentId) => {
    try {
      const response = await apiRequest(`programs/${eventId}/add-participant`, {
        method: 'POST',
        body: { resident_id: residentId }
      })

      const result = await response.json()
      setSuccessMessage('Participant added successfully!')
      fetchEvents()
      setParticipantsDialog(null)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error adding participant:', error)
      setErrorMessage('Failed to add participant. Please try again.')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleSendBulkSMS = async (eventId) => {
    setSmsDialog(eventId)
    setSmsMessage(`Join us for our upcoming event! We'll see you there. - Barangay Batia`)
  }

  const handleConfirmSendSMS = async () => {
    try {
      const response = await apiRequest(`programs/${smsDialog}/notify-participants`, {
        method: 'POST',
        body: { message: smsMessage }
      })

      const result = await response.json()
      setSuccessMessage(`SMS sent to ${result.sms_sent || 0} participants!`)
      setSmsDialog(null)
      setSmsMessage('')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error sending bulk SMS:', error)
      setErrorMessage('Failed to send SMS. Please try again.')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned': return 'info'
      case 'Ongoing': return 'warning'
      case 'Completed': return 'success'
      case 'Cancelled': return 'error'
      default: return 'default'
    }
  }

  const getEventStatus = (eventDate) => {
    const today = new Date()
    const eventDateObj = new Date(eventDate)

    if (eventDateObj < today) return 'Past'
    if (eventDateObj.toDateString() === today.toDateString()) return 'Today'
    return 'Upcoming'
  }

  return (
    <Box>
      {(successMessage || errorMessage) && (
        <Box sx={{ mb: 3 }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
          Community Events & Programs
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Create Event
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {events.slice(0, 3).map((event) => (
          <Grid size={{ xs: 12, md: 4 }} key={event.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {event.program_name}
                  </Typography>
                  <Chip
                    label={event.status}
                    color={getStatusColor(event.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📅 {new Date(event.program_date).toLocaleDateString()}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📍 {event.sitio_name}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  👥 {event.participants_count || 0} participants
                </Typography>

                {event.description && (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {event.description.length > 100
                      ? `${event.description.substring(0, 100)}...`
                      : event.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => setParticipantsDialog(event)}>
                    <PersonAdd sx={{ mr: 1 }} />
                    Add Participants
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleSendBulkSMS(event.id)}
                    disabled={!event.participants_count}
                  >
                    <Sms sx={{ mr: 1 }} />
                    Notify
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Sitio</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Participants</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {event.program_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.description?.substring(0, 50)}...
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(event.program_date).toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={getEventStatus(event.program_date)}
                    size="small"
                    color={getEventStatus(event.program_date) === 'Today' ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>{event.sitio_name}</TableCell>
                <TableCell>
                  <Chip
                    label={event.status}
                    color={getStatusColor(event.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {event.participants_count || 0}
                    </Typography>
                    <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                </TableCell>
                <TableCell>₱{event.budget_allocated || 0}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Event">
                      <IconButton size="small" onClick={() => handleOpenDialog(event)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Participants">
                      <IconButton size="small" onClick={() => setParticipantsDialog(event)}>
                        <PersonAdd />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send SMS">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleSendBulkSMS(event.id)}
                          disabled={!event.participants_count}
                        >
                          <Sms />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Event Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Event Name"
              value={formData.program_name}
              onChange={(e) => setFormData({...formData, program_name: e.target.value})}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Event Date"
                type="date"
                value={formData.program_date}
                onChange={(e) => setFormData({...formData, program_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />

              <FormControl fullWidth>
                <InputLabel>Sitio</InputLabel>
                <Select
                  value={formData.sitio_id}
                  onChange={(e) => setFormData({...formData, sitio_id: e.target.value})}
                  label="Sitio"
                >
                  {sitios.map((sitio) => (
                    <MenuItem key={sitio.id} value={sitio.id}>{sitio.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Organizer"
                value={formData.organizer}
                onChange={(e) => setFormData({...formData, organizer: e.target.value})}
              />

              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget_allocated}
                onChange={(e) => setFormData({...formData, budget_allocated: e.target.value})}
                InputProps={{ startAdornment: '₱' }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                label="Status"
              >
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="Ongoing">Ongoing</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editing ? 'Update' : 'Create'} Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Participants Dialog */}
      <Dialog open={!!participantsDialog} onClose={() => setParticipantsDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>Add Participants to "{participantsDialog?.program_name}"</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select residents to add as participants to this event.
          </Typography>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {residents.map((resident) => (
              <Card key={`participant-${resident.Resident_ID}`} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {resident.First_Name} {resident.Middle_Name} {resident.Last_Name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resident.sitio_name} • Age: {resident.Age}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAddParticipant(participantsDialog.id, resident.Resident_ID)}
                    >
                      Add
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParticipantsDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Send SMS Dialog */}
      <Dialog open={!!smsDialog} onClose={() => setSmsDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Send SMS Notification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Send SMS notification to all event participants.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="SMS Message"
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            helperText={`${smsMessage.length}/160 characters`}
            inputProps={{ maxLength: 160 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmsDialog(null)}>Cancel</Button>
          <Button
            onClick={handleConfirmSendSMS}
            variant="contained"
            disabled={!smsMessage.trim()}
          >
            Send SMS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CommunityEvents
