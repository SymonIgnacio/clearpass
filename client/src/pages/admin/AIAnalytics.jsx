import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, LinearProgress } from '@mui/material';
import api from '../../utils/api';

const AIAnalytics = () => {
  const [metrics, setMetrics] = useState({
    model_accuracy: 0,
    system_health: 0,
    predictions_made: 0,
    uptime: '0h'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/admin/ai-metrics');
      setMetrics(response.data.metrics || metrics);
    } catch (error) {
      console.error('Failed to fetch AI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>AI Analytics Dashboard</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Model Accuracy</Typography>
              <Typography variant="h3" color="primary">{metrics.model_accuracy}%</Typography>
              <LinearProgress variant="determinate" value={metrics.model_accuracy} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Health</Typography>
              <Typography variant="h3" color="success.main">{metrics.system_health}%</Typography>
              <LinearProgress variant="determinate" value={metrics.system_health} color="success" sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Predictions Made</Typography>
              <Typography variant="h3">{metrics.predictions_made}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Uptime</Typography>
              <Typography variant="h3">{metrics.uptime}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAnalytics;
