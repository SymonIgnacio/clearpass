import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  People,
  Description,
  Gavel,
  LocationOn,
  TrendingUp,
  Warning
} from '@mui/icons-material';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalResidents: 0,
    totalCertificates: 0,
    activeBlotters: 0,
    totalSitios: 4
  });

  useEffect(() => {
    fetch('http://localhost:3001/api/dashboard/stats')
      .then(response => response.json())
      .then(data => setStats(data))
      .catch(error => console.error('Error fetching dashboard stats:', error));
  }, []);

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const recentActivities = [
    { type: 'Certificate', action: 'Barangay Clearance issued to Juan Dela Cruz', time: '2 hours ago' },
    { type: 'Blotter', action: 'New incident reported in Batia Proper', time: '4 hours ago' },
    { type: 'Certificate', action: 'Indigency Certificate approved for Maria Santos', time: '6 hours ago' },
    { type: 'System', action: 'Database backup completed successfully', time: '1 day ago' }
  ];

  const sitioData = [
    { name: 'Batia Proper', population: '~15,000', status: 'Central Sitio' },
    { name: 'Northville 5', population: '~12,000', status: 'Northern Area' },
    { name: 'St. Martha', population: '~11,000', status: 'Eastern Subdivision' },
    { name: 'AFP/PNP', population: '~10,000', status: 'Military Housing' }
  ];

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Barangay Batia Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Welcome to the Barangay Management System. Overview of current operations and statistics.
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Residents"
            value={stats.totalResidents}
            icon={<People fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Certificates Issued"
            value={stats.totalCertificates}
            icon={<Description fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Blotters"
            value={stats.activeBlotters}
            icon={<Gavel fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sitios"
            value={stats.totalSitios}
            icon={<LocationOn fontSize="large" />}
            color="info"
          />
        </Grid>

        {/* Sitio Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
              Sitio Overview
            </Typography>
            <List>
              {sitioData.map((sitio, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={sitio.name}
                    secondary={`Population: ${sitio.population} • ${sitio.status}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Activities
            </Typography>
            <List>
              {recentActivities.map((activity, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={activity.action}
                    secondary={activity.time}
                  />
                  <Chip
                    label={activity.type}
                    size="small"
                    color={activity.type === 'Blotter' ? 'warning' : 'primary'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Status & Features
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">✓ QR Integration</Typography>
                  <Typography variant="body2">Certificate verification active</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">✓ Blotter Blocking</Typography>
                  <Typography variant="body2">Auto-block for active cases</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">✓ Role-Based Access</Typography>
                  <Typography variant="body2">6 user roles configured</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">✓ Database Connected</Typography>
                  <Typography variant="body2">MySQL barangay_batia</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;