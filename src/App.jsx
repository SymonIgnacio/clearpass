import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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

  // Enhanced authentication check with retry logic - supports both staff and resident auth
  useEffect(() => {
    // Check for officer authentication (database + JWT)
    const officerToken = localStorage.getItem('authToken')
    const officerUser = localStorage.getItem('user')

    // Check for resident authentication (Firebase-only)
    const residentUser = localStorage.getItem('residentUser')
    const residentToken = localStorage.getItem('residentAuthToken')

    // No authentication found - set logged out
    if ((!officerToken || !officerUser) && (!residentUser || !residentToken)) {
      setIsAuthenticated(false)
      setUser(null)
      return
    }

    // Handle officer authentication
    if (officerToken && officerUser) {
      try {
        const parsedUser = JSON.parse(officerUser)
        console.log('🔐 Initializing with officer auth data:', { userId: parsedUser.id, role: parsedUser.role })

        // Try to verify the token and get fresh profile data
        const profileResponse = fetch('http://localhost:3001/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${officerToken}`,
            'Content-Type': 'application/json'
          }
        }).then(response => {
          if (response.ok) {
            return response.json().then(profileData => {
              console.log('✅ Officer profile verification successful:', { userId: profileData.id, role: profileData.role })
              localStorage.setItem('user', JSON.stringify(profileData))
              setUser(profileData)
              setIsAuthenticated(true)
            })
          } else if (response.status === 401) {
            console.log('❌ Officer token expired or invalid, clearing auth data')
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
            setIsAuthenticated(false)
          }
        }).catch(error => {
          console.warn('⚠️ Officer authentication check failed, using stored data as fallback:', error.message)
          setUser(parsedUser)
          setIsAuthenticated(true)
        })
      } catch (error) {
        console.warn('⚠️ Officer authentication load failed:', error.message)
        if (officerUser) {
          try {
            const parsedUser = JSON.parse(officerUser)
            setUser(parsedUser)
            setIsAuthenticated(true)
          } catch (parseError) {
            console.error('Failed to parse stored officer user data')
            setIsAuthenticated(false)
          }
        }
      }
      return
    }

    // Handle resident authentication
    if (residentUser && residentToken) {
      try {
        const parsedUser = JSON.parse(residentUser)
        console.log('🔐 Initializing with resident auth data:', { uid: parsedUser.uid, role: parsedUser.role })

        // For residents, just validate localStorage data exists
        // Firebase handles session management client-side
        setUser(parsedUser)
        setIsAuthenticated(true)
        console.log('✅ Resident authentication successful via localStorage')
      } catch (error) {
        console.error('❌ Failed to parse resident user data:', error)
        localStorage.removeItem('residentUser')
        localStorage.removeItem('residentAuthToken')
        setIsAuthenticated(false)
      }
      return
    }

    // Should have been caught by the early return, but just in case
    setIsAuthenticated(false)
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

          {/* Protected routes */}
          <Route
            path="/*"
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
                      <Routes>
                        <Route path="/" element={
                          user?.role === 'resident' ?
                            <ResidentDashboard user={user} /> :
                            <Dashboard user={user} />
                        } />
                        <Route path="/residents" element={<Residents user={user} />} />
                        <Route path="/blotter" element={<Blotter user={user} />} />
                        <Route
                          path="/documents"
                          element={
                            <ProtectedRoute requiredRoles={['admin', 'captain']}>
                              <DocumentsDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/census" element={<Census user={user} />} />
                        <Route path="/ai-dashboard" element={<AIDashboard user={user} />} />
                        {/* Backward compatibility redirects */}
                        <Route path="/certificates" element={<Navigate to="/documents" replace />} />
                        <Route path="/document-templates" element={<Navigate to="/documents" replace />} />
                        <Route path="/ai-patrol" element={<Navigate to="/ai-dashboard" replace />} />
                        <Route path="/ronda-analytics" element={<Navigate to="/ai-dashboard" replace />} />
                        <Route path="/qr-verify" element={<QRVerification user={user} />} />
                        <Route path="/events" element={<CommunityEvents user={user} />} />
                      </Routes>
                    </Box>
                  </Box>

                  {/* BANTAY AI Chatbot - Available on all authenticated pages */}
                  <BantayChatbot />
                </Box>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  </NotificationProvider>
</ErrorBoundary>
  )
}

export default App
