import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Search,
  Event,
  LocationOn,
  CalendarMonth,
  Campaign,
  AccessTime,
  Info
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const ResidentPrograms = () => {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [searchTerm, statusFilter, programs]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || data);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrograms = () => {
    let filtered = [...programs];

    // Status Filter
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(p => {
        const date = new Date(p.date);
        if (statusFilter === 'upcoming') return date >= now;
        if (statusFilter === 'completed') return p.status === 'Completed' || date < now;
        return p.status === statusFilter;
      });
    }

    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(lowerSearch) ||
        p.description?.toLowerCase().includes(lowerSearch) ||
        p.location?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort by Date (Upcoming first)
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredPrograms(filtered);
  };

  const getStatusColor = (status, date) => {
    if (status === 'Completed') return 'success';
    if (status === 'Cancelled') return 'error';
    
    const eventDate = new Date(date);
    const now = new Date();
    
    if (eventDate < now) return 'default'; // Past
    if (eventDate.toDateString() === now.toDateString()) return 'success'; // Today
    return 'primary'; // Upcoming
  };

  const getStatusLabel = (status, date) => {
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled') return 'Cancelled';
    
    const eventDate = new Date(date);
    const now = new Date();
    
    if (eventDate < now) return 'Completed';
    if (eventDate.toDateString() === now.toDateString()) return 'Happening Today';
    return 'Upcoming';
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <Campaign sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
          Community Programs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and participate in upcoming events and initiatives in our barangay.
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search programs..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ minWidth: '150px' }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="upcoming">Upcoming</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </TextField>
      </Box>

      {/* Programs Grid */}
      {filteredPrograms.length > 0 ? (
        <Grid container spacing={3}>
          {filteredPrograms.map((program) => (
            <Grid item xs={12} sm={6} md={4} key={program.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip 
                      label={getStatusLabel(program.status, program.date)} 
                      color={getStatusColor(program.status, program.date)}
                      size="small"
                      icon={<AccessTime />}
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    {program.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                    <CalendarMonth sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2">
                      {new Date(program.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                    <LocationOn sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2">
                      {program.location || 'Barangay Hall'}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3
                  }}>
                    {program.description}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Info />}
                    onClick={() => setSelectedProgram(program)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Event sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No programs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Box>
      )}

      {/* Detail Modal */}
      <Dialog 
        open={!!selectedProgram} 
        onClose={() => setSelectedProgram(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedProgram && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {selectedProgram.title}
                </Typography>
                <Chip 
                  label={getStatusLabel(selectedProgram.status, selectedProgram.date)} 
                  color={getStatusColor(selectedProgram.status, selectedProgram.date)}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Description</Typography>
                  <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {selectedProgram.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <CalendarMonth sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={500}>
                          {new Date(selectedProgram.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {selectedProgram.time && (
                         <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, ml: 3.5 }}>
                            <Typography variant="body2" fontWeight={500}>
                                {selectedProgram.time}
                            </Typography>
                         </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LocationOn sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={500}>
                          {selectedProgram.location}
                        </Typography>
                      </Box>
                    </Box>

                    {selectedProgram.organizer && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Organizer</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                          {selectedProgram.organizer}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelectedProgram(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default ResidentPrograms;
