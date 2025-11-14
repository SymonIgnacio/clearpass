
import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Card, CardContent, Paper, Grid } from '@mui/material';
import { mockBlotterData } from '../data/mockBlotter';

// This is a mock/dummy function for the AI analysis
const getAIEnhancedSuggestion = (data) => {
  // In a real scenario, this function would make an API call to a backend service
  // which then communicates with a real AI model (like Gemini).
  // For now, we'll simulate the AI's logic and response.

  const hotspots = {};
  data.forEach(report => {
    if (!hotspots[report.location]) {
      hotspots[report.location] = 0;
    }
    hotspots[report.location]++;
  });

  // Find the most problematic area
  let maxIncidents = 0;
  let topHotspot = 'None';
  for (const location in hotspots) {
    if (hotspots[location] > maxIncidents) {
      maxIncidents = hotspots[location];
      topHotspot = location;
    }
  }

  // Generate a mock suggestion
  if (topHotspot !== 'None') {
    return `
      <p><b>Analysis Complete.</b></p>
      <p>Based on the data, <b>${topHotspot}</b> has the highest number of reported incidents (${maxIncidents} reports).</p>
      <p><b>Recommendation:</b> It is advised to increase patrol presence in this area, especially during late-night hours (10 PM - 2 AM).</p>
      <p><b>Suggested Action:</b> Assign a team of <b>2-3 tanods</b> to conduct regular foot patrols in <b>${topHotspot}</b>. This should help deter potential incidents and improve resident safety.</p>
    `;
  }

  return '<p>No significant incident patterns found. All areas appear safe.</p>';
};


const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const handleAnalyze = () => {
    setLoading(true);
    setSuggestion(null);

    // Simulate the delay of an AI API call
    setTimeout(() => {
      const aiResponse = getAIEnhancedSuggestion(mockBlotterData);
      setSuggestion(aiResponse);
      setLoading(false);
    }, 2500); // 2.5-second delay
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Barangay Blotter AI Analytics
      </Typography>
      <Typography paragraph sx={{ mb: 3 }}>
        Leverage AI to analyze historical blotter data. This tool identifies incident hotspots and provides actionable recommendations to enhance security and optimize tanod deployment.
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleAnalyze}
        disabled={loading}
        size="large"
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate AI-Powered Security Analysis'}
      </Button>

      {suggestion && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Security Suggestion
            </Typography>
            <Box dangerouslySetInnerHTML={{ __html: suggestion }} />
          </CardContent>
        </Card>
      )}
    </Paper>
  );
};

export default Analytics;
