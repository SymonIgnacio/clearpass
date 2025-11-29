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
  AvatarGroup
} from '@mui/material'
import { Add, Event, People, Edit, PersonAdd, Sms } from '@mui/icons-material'

const CommunityEvents = () => {
  const [events, setEvents] = useState([])
  const [residents, setResidents] = useState([])
  const [sitios, setSitios] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [participantsDialog, setParticipantsDialog] = useState(null)
  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    event_date: '',
    sitio_id: '',
    status: 'Planned',
    organizer: '',
    budget: '',
    notes: ''
  })

  useEffect(() => {
    fetchEvents()
    fetchResidents()
    fetchSitios()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchResidents = async () => {
    try {
      const response = await fetch('/api/residents')
      if (response.ok) {
        const data = await response.json()
        setResidents(data)
      }
    } catch (error) {
      console.error('Error fetching residents:', error)
    }
  }

  const fetchSitios = async () => {
    try {
      const response = await fetch('/api/sitios')
      if (response.ok) {
        const data = await response.json()
        setSitios(data)
      }
    } catch (error) {
      console.error('Error fetching sitios:', error)
    }
  }

  const handleOpenDialog = (event = null) => {
    if (event) {
      setEditing(event)
      setFormData({
        event_name: event.event_name || '',
        description: event.description || '',
        event_date: event.event_date || '',
        sitio_id: event.sitio_id || '',
        status: event.status || 'Planned',
        organizer: event.organizer || '',
        budget: event.budget || '',
        notes: event.notes || ''
      })
    } else {
      setEditing(null)
      setFormData({
        event_name: '',
        description: '',
        event_date: '',
        sitio_id: '',
        status: 'Planned',
        organizer: '',
        budget: '',
        notes: ''
      })
    }
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setEditing(null)
  }

  const handleSave = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/api/programs/${editing.id}` : '/api/programs'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchEvents()
        handleCloseDialog()
      }
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleAddParticipant = async (eventId, residentId) => {
    try {
      const response = await fetch(`/api/programs/${eventId}/add-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resident_id: residentId })
      })

      if (response.ok) {
        fetchEvents()
        setParticipantsDialog(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add participant')
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      alert('Failed to add participant')
    }
  }

  const handleSendBulkSMS = async (eventId) => {
    const message = prompt('Enter SMS message to send to all participants (use {name} for personalization):')
    if (!message) return

    try {
      const response = await fetch(`/api/programs/${eventId}/notify-participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`SMS sent to ${result.sms_sent} participants!`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send SMS')
      }
    } catch (error) {
      console.error('Error sending bulk SMS:', error)
      alert('Failed to send bulk SMS')
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
          <Grid item xs={12} md={4} key={event.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {event.event_name}
                  </Typography>
                  <Chip
                    label={event.status}
                    color={getStatusColor(event.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📅 {new Date(event.event_date).toLocaleDateString()}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📍 {event.sitio_name}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  👥 {event.participant_count || 0} participants
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
                    disabled={!event.participant_count}
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
                      {event.event_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.description?.substring(0, 50)}...
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(event.event_date).toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={getEventStatus(event.event_date)}
                    size="small"
                    color={getEventStatus(event.event_date) === 'Today' ? 'warning' : 'default'}
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
                      {event.participant_count || 0}
                    </Typography>
                    <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                </TableCell>
                <TableCell>₱{event.budget || 0}</TableCell>
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
                      <IconButton
                        size="small"
                        onClick={() => handleSendBulkSMS(event.id)}
                        disabled={!event.participant_count}
                      >
                        <Sms />
                      </IconButton>
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
              value={formData.event_name}
              onChange={(e) => setFormData({...formData, event_name: e.target.value})}
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
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
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
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
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
        <DialogTitle>Add Participants to "{participantsDialog?.event_name}"</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select residents to add as participants to this event.
          </Typography>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {residents.map((resident) => (
              <Card key={resident.id} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {resident.first_name} {resident.middle_name} {resident.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resident.sitio_name} • Age: {resident.age}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAddParticipant(participantsDialog.id, resident.id)}
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
    </Box>
  )
}

export default CommunityEvents
