import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container, Box } from '@mui/material'
import Dashboard from './pages/Dashboard'
import ResidentDashboard from './pages/ResidentDashboard'
import Residents from './pages/Residents'
import Blotter from './pages/Blotter'
import DocumentsDashboard from './pages/DocumentsDashboard'
import Census from './pages/Census'
import AIDashboard from './pages/AIDashboard'
import OCRAutoFill from './pages/OCRAutoFill'
import QRVerification from './pages/QRVerification'
import CommunityEvents from './pages/CommunityEvents'
import Login from './pages/Login'
import ResidentSignup from './pages/ResidentSignup'
import AccountVerification from './components/AccountVerification'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import BantayChatbot from './components/BantayChatbot'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './contexts/NotificationContext'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a73e8', // Google Blue
      light: '#4285f4',
      dark: '#1557b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#34a853', // Google Green
      light: '#81c784',
      dark: '#2e7d32',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ea4335', // Google Red
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#fbbc04', // Google Yellow
      light: '#fff176',
      dark: '#f57c00',
    },
    info: {
      main: '#4285f4',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    success: {
      main: '#34a853',
      light: '#81c784',
      dark: '#2e7d32',
    },
    background: {
      default: '#f8f9fa', // Google Gray 50
      paper: '#ffffff',
    },
    text: {
      primary: '#202124', // Google Gray 900
      secondary: '#5f6368', // Google Gray 600
    },
    divider: '#e8eaed',
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 400,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
      lineHeight: 1.25,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.35,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.45,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.02857em',
      textTransform: 'none', // Remove uppercase from buttons
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners like Google Material Design
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          border: '1px solid #e8eaed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
        elevation2: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
        },
        elevation3: {
          boxShadow: '0 4px 8px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#dadce0',
            },
            '&:hover fieldset': {
              borderColor: '#bdc1c6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1a73e8',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#202124',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          borderRight: '1px solid #e8eaed',
        },
      },
    },
  },
})

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  // Enhanced authentication check with retry logic
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('authToken')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        setIsAuthenticated(false)
        return
      }

      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('🔐 Initializing with stored auth data:', { userId: parsedUser.id, role: parsedUser.role })

        // Try to verify the token and get fresh profile data
        const profileResponse = await fetch('http://localhost:3001/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          console.log('✅ Profile verification successful:', { userId: profileData.id, role: profileData.role })

          // Update with fresh data from server
          localStorage.setItem('user', JSON.stringify(profileData))
          setUser(profileData)
          setIsAuthenticated(true)
        } else if (profileResponse.status === 401) {
          // Token expired or invalid - clear auth data
          console.log('❌ Token expired or invalid, clearing auth data')
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        } else {
          // Other errors - try to use stored data as fallback
          console.warn('⚠️ Profile verification failed, using stored data as fallback')
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        // Network or parsing error - use stored data as fallback
        console.warn('⚠️ Authentication check failed, using stored data as fallback:', error.message)
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)
      }
    }

    checkAuthentication()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <ResidentSignup />
              )
            }
          />

          <Route
            path="/verify-account"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <AccountVerification />
              )
            }
          />

          {/* Protected Layout Route */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Box sx={{
                  display: 'flex',
                  minHeight: '100vh',
                  backgroundColor: 'background.default'
                }}>
                  <Sidebar user={user} onLogout={handleLogout} />
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      marginLeft: '280px', // Account for sidebar width
                      transition: 'margin-left 0.3s ease-in-out',
                    }}
                  >
                    <Header user={user} onLogout={handleLogout} />
                    <Box sx={{
                      p: 4,
                      minHeight: 'calc(100vh - 64px)', // Account for header height
                      backgroundColor: 'background.default'
                    }}>
                      <Outlet />
                      {/* BANTAY AI Chatbot - Available on all authenticated pages */}
                      <BantayChatbot />
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            {/* Nested protected routes */}
            <Route index element={
              user?.role === 'resident' ?
                <ResidentDashboard user={user} /> :
                <Dashboard user={user} />
            } />
            <Route path="residents" element={<Residents user={user} />} />
            <Route path="blotter" element={<Blotter user={user} />} />
            <Route
              path="documents"
              element={
                <ProtectedRoute requiredRoles={['admin', 'captain', 'secretary']}>
                  <DocumentsDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="census" element={<Census user={user} />} />
            <Route path="ai-dashboard" element={<AIDashboard user={user} />} />
            <Route path="events" element={<CommunityEvents user={user} />} />

            {/* Legacy redirects */}
            <Route path="qr-verify" element={<Navigate to="/" replace />} />
            <Route path="qr-verification" element={<Navigate to="/" replace />} />

            {/* Backward compatibility redirects */}
            <Route path="certificates" element={<Navigate to="documents" replace />} />
            <Route path="document-templates" element={<Navigate to="documents" replace />} />
            <Route path="ai-patrol" element={<Navigate to="ai-dashboard" replace />} />
            <Route path="ronda-analytics" element={<Navigate to="ai-dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  </NotificationProvider>
</ErrorBoundary>
  )
}

export default App
