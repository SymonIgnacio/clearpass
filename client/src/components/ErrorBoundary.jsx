import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Paper,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  ExpandMore,
  ExpandLess,
  BugReport,
  Home
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, errorId: Date.now() };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In a real application, you might want to send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // Simulate sending error to monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    console.log('Error Report:', errorReport);

    // In production, you would send this to your error monitoring service:
    // errorReportingService.captureException(error, { extra: errorReport });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            p: 2
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%', boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              {/* Header */}
              <Box
                sx={{
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <ErrorIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Something went wrong
                </Typography>
                <Typography variant="body1">
                  We're sorry, but something unexpected happened.
                </Typography>
              </Box>

              {/* Main Content */}
              <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                  <AlertTitle>Application Error</AlertTitle>
                  An unexpected error occurred in the application. This has been reported to our technical team.
                </Alert>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Error ID: <code>{this.state.errorId}</code>
                </Typography>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleRetry}
                    sx={{ flex: 1, minWidth: 120 }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Home />}
                    onClick={this.handleGoHome}
                    sx={{ flex: 1, minWidth: 120 }}
                  >
                    Go Home
                  </Button>
                </Box>

                {/* Developer Details (only in development) */}
                {isDevelopment && (
                  <Box>
                    <Button
                      onClick={this.toggleDetails}
                      startIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                      endIcon={<BugReport />}
                      sx={{
                        mb: 2,
                        textTransform: 'none',
                        color: 'text.secondary'
                      }}
                    >
                      {showDetails ? 'Hide' : 'Show'} Technical Details
                    </Button>

                    <Collapse in={showDetails}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'grey.200',
                          maxHeight: 300,
                          overflow: 'auto'
                        }}
                      >
                        <Typography variant="h6" color="error" gutterBottom>
                          Error Details
                        </Typography>
                        <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {error && error.toString()}
                        </Typography>

                        {errorInfo && (
                          <>
                            <Typography variant="h6" color="error" sx={{ mt: 2, mb: 1 }}>
                              Component Stack
                            </Typography>
                            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {errorInfo.componentStack}
                            </Typography>
                          </>
                        )}
                      </Paper>
                    </Collapse>
                  </Box>
                )}

                {/* User-Friendly Message */}
                <Alert severity="info" sx={{ mt: 3 }}>
                  <AlertTitle>What can you do?</AlertTitle>
                  <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                    <li>Click "Try Again" to reload the current page</li>
                    <li>Click "Go Home" to return to the dashboard</li>
                    <li>Refresh your browser if the problem persists</li>
                    <li>Contact technical support if you continue experiencing issues</li>
                  </ul>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
