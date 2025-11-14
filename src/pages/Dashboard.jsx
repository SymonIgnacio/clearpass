
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { Group, Home, Gavel } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    residents: 0,
    households: 0,
    blotter: 0,
    blotterStatus: [],
  });

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/residents').then(res => res.json()),
      fetch('http://localhost:3001/api/households').then(res => res.json()),
      fetch('http://localhost:3001/api/blotter').then(res => res.json()),
    ])
    .then(([residentsData, householdsData, blotterData]) => {
      const blotterStatus = blotterData.reduce((acc, item) => {
        const existing = acc.find(i => i.name === item.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ name: item.status, count: 1 });
        }
        return acc;
      }, []);

      setStats({
        residents: residentsData.length,
        households: householdsData.length,
        blotter: blotterData.length,
        blotterStatus: blotterStatus,
      });
    })
    .catch(error => console.error('Error fetching dashboard data:', error));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Group fontSize="large" color="primary" />
              <Typography variant="h5" component="div">
                {stats.residents}
              </Typography>
              <Typography color="text.secondary">
                Total Residents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Home fontSize="large" color="secondary" />
              <Typography variant="h5" component="div">
                {stats.households}
              </Typography>
              <Typography color="text.secondary">
                Total Households
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Gavel fontSize="large" color="error" />
              <Typography variant="h5" component="div">
                {stats.blotter}
              </Typography>
              <Typography color="text.secondary">
                Total Blotter Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Blotter Status</Typography>
              <BarChart width={500} height={300} data={stats.blotterStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
