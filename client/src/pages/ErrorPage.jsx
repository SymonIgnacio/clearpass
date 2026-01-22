import React from 'react';
import { Box, Typography, Button, Container, Card, CardContent, Alert } from '@mui/material';
import { ErrorOutline, Home, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function ErrorPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Container maxWidth='sm'>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ErrorOutline
              sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 3,
              }}
            />
            <Typography variant='h4' component='h1' gutterBottom fontWeight='bold'>
              Oops! Something went wrong
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
              We encountered an unexpected error while loading this page. Please try again or return
              to the dashboard.
            </Typography>

            <Alert severity='error' sx={{ mb: 4, textAlign: 'left' }}>
              <Typography variant='body2'>
                Page Load Failed: Unable to load the requested component
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant='contained'
                startIcon={<Refresh />}
                onClick={handleRefresh}
                size='large'
              >
                Refresh Page
              </Button>
              <Button variant='outlined' startIcon={<Home />} onClick={handleGoHome} size='large'>
                Go to Dashboard
              </Button>
            </Box>

            <Typography variant='caption' color='text.secondary' sx={{ mt: 4, display: 'block' }}>
              If this problem persists, please contact technical support.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default ErrorPage;
