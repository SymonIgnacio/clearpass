import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container, Box, CircularProgress } from '@mui/material'

// Eager load critical components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider } from './contexts/AuthContext'
import { ROLES } from './utils/roles'

// Import critical pages directly to avoid dynamic import issues
import Login from './pages/Login'
import ResidentLogin from './pages/ResidentLogin'
import ResidentRegister from './pages/ResidentRegister'
import OfficerLogin from './pages/OfficerLogin'
import Unauthorized from './pages/Unauthorized'

// Lazy load non-critical pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ResidentDashboard = lazy(() => import('./pages/ResidentDashboard'))
const Residents = lazy(() => import('./pages/Residents'))
const Users = lazy(() => import('./pages/Users'))
const Blotter = lazy(() => import('./pages/Blotter'))
const DocumentsDashboard = lazy(() => import('./pages/DocumentsDashboard'))
const Census = lazy(() => import('./pages/Census'))
const QRVerification = lazy(() => import('./pages/QRVerification'))
const CommunityEvents = lazy(() => import('./pages/CommunityEvents'))
const Settings = lazy(() => import('./pages/Settings'))
const SuperAdminSettings = lazy(() => import('./pages/SuperAdminSettings'))
const ResidentSettings = lazy(() => import('./pages/ResidentSettings'))
const CertificateRequest = lazy(() => import('./pages/CertificateRequest'))
const RequestHistory = lazy(() => import('./pages/RequestHistory'))
const AdminBackup = lazy(() => import('./pages/AdminBackup'))
const ResidentAnnouncements = lazy(() => import('./pages/ResidentAnnouncements'))
const ClerkAIInsights = lazy(() => import('./pages/ClerkAIInsights'))
const CaseDetail = lazy(() => import('./pages/CaseDetail'))
const ResidentProfile = lazy(() => import('./pages/ResidentProfile'))
const ComplaintHistory = lazy(() => import('./pages/ComplaintHistory'))
const ResidentBlotterReport = lazy(() => import('./pages/ResidentBlotterReport'))
const SystemLogs = lazy(() => import('./pages/admin/SystemLogs'))
const Backup = lazy(() => import('./pages/admin/Backup'))
const AIAnalytics = lazy(() => import('./pages/admin/AIAnalytics'))
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'))
const UserManagement = lazy(() => import('./pages/Users'))
const Register = lazy(() => import('./pages/Register'))
const AIPatrol = lazy(() => import('./pages/AIPatrol'))
const RondaAnalytics = lazy(() => import('./pages/RondaAnalytics'))
const OfficerNewCase = lazy(() => import('./pages/OfficerNewCase'))
const OfficerAttendance = lazy(() => import('./pages/OfficerAttendance'))
const OfficerReports = lazy(() => import('./pages/OfficerReports'))
const SecretarySettings = lazy(() => import('./pages/SecretarySettings'))
const AccountVerification = lazy(() => import('./components/AccountVerification'))

// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
)

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

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/resident/login" element={<ResidentLogin />} />
              <Route path="/resident/register" element={<ResidentRegister />} />
              {/* SECURITY: Public signup disabled per business rules */}
              {/* <Route path="/signup" element={<Register />} /> */}
              <Route path="/officerlogin" element={<OfficerLogin />} />
              <Route path="/verify-account" element={<AccountVerification />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Layout Route */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Box sx={{
                      display: 'flex',
                      minHeight: '100vh',
                      backgroundColor: 'background.default'
                    }}>
                      <Sidebar />
                      <Box
                        component="main"
                        sx={{
                          flexGrow: 1,
                          marginLeft: '280px', // Account for sidebar width
                          transition: 'margin-left 0.3s ease-in-out',
                        }}
                      >
                        <Header />
                        <Box sx={{
                          p: 4,
                          minHeight: 'calc(100vh - 64px)', // Account for header height
                          backgroundColor: 'background.default'
                        }}>
                          <Outlet />
                        </Box>
                      </Box>
                    </Box>
                  </ProtectedRoute>
                }
              >
              {/* Nested protected routes */}
            <Route index element={<Dashboard />} />

            {/* Role-specific dashboard routes */}
            <Route path="admin/dashboard" element={<Dashboard />} />
            <Route path="secretary/dashboard" element={<Dashboard />} />
            <Route path="clerk/dashboard" element={<Dashboard />} />
            <Route path="officer/dashboard" element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="residents" element={<Residents />} />
            <Route path="users" element={
              <ProtectedRoute requiredRoles={[1, 2, 5]}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="blotter" element={
              <ProtectedRoute requiredRoles={[1, 2, 3, 4, 5, 6]}>
                <Blotter />
              </ProtectedRoute>
            } />
            <Route path="documents" element={
              <ProtectedRoute requiredRoles={[1, 2, 3, 4, 5, 6]}>
                <DocumentsDashboard />
              </ProtectedRoute>
            } />

            <Route path="census" element={
              <ProtectedRoute requiredRoles={[1, 2, 3, 4, 5, 6]}>
                <Census />
              </ProtectedRoute>
            } />
            <Route path="events" element={
              <ProtectedRoute requiredRoles={[1, 2, 3, 5, 6]}>
                <CommunityEvents />
              </ProtectedRoute>
            } />

            <Route path="settings" element={
              <ProtectedRoute requiredRoles={[1]}>
                <SuperAdminSettings />
              </ProtectedRoute>
            } />

            {/* Legacy redirects */}
            <Route path="qr-verify" element={<Navigate to="/" replace />} />
            <Route path="qr-verification" element={<Navigate to="/" replace />} />

            {/* AI Routes - Available to authenticated staff */}
            <Route path="ai-dashboard" element={<AIPatrol />} />
            <Route path="ai-patrol" element={<AIPatrol />} />
            <Route path="ronda-analytics" element={<RondaAnalytics />} />

            {/* Clerk Routes */}
            <Route path="clerk/ai-insights" element={
              <ProtectedRoute requiredRoles={[2]}>
                <ClerkAIInsights />
              </ProtectedRoute>
            } />

            {/* Officer Routes */}
            <Route path="officer/case/:caseId" element={
              <ProtectedRoute requiredRoles={[3]}>
                <CaseDetail />
              </ProtectedRoute>
            } />
            <Route path="officer/new-case" element={
              <ProtectedRoute requiredRoles={[3]}>
                <OfficerNewCase />
              </ProtectedRoute>
            } />
            <Route path="officer/attendance" element={
              <ProtectedRoute requiredRoles={[3]}>
                <OfficerAttendance />
              </ProtectedRoute>
            } />
            <Route path="officer/reports" element={
              <ProtectedRoute requiredRoles={[3]}>
                <OfficerReports />
              </ProtectedRoute>
            } />

            {/* Admin Routes - IT Admin Only */}
            <Route path="admin/staff" element={
              <ProtectedRoute requiredRoles={[1]}>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredRoles={[1]}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="admin/system-logs" element={
              <ProtectedRoute requiredRoles={[1]}>
                <SystemLogs />
              </ProtectedRoute>
            } />
            <Route path="admin/backup" element={
              <ProtectedRoute requiredRoles={[1]}>
                <AdminBackup />
              </ProtectedRoute>
            } />
            <Route path="admin/ai-analytics" element={
              <ProtectedRoute requiredRoles={[1]}>
                <AIAnalytics />
              </ProtectedRoute>
            } />

            {/* Resident Routes */}
            <Route path="resident/dashboard" element={
              <ProtectedRoute requiredRoles={[4]}>
                <ResidentDashboard />
              </ProtectedRoute>
            } />
            <Route path="resident/request-certificate" element={
              <ProtectedRoute requiredRoles={[4]}>
                <CertificateRequest />
              </ProtectedRoute>
            } />
            <Route path="resident/requests" element={
              <ProtectedRoute requiredRoles={[4]}>
                <RequestHistory />
              </ProtectedRoute>
            } />
            <Route path="resident/blotter-report" element={
              <ProtectedRoute requiredRoles={[4]}>
                <ResidentBlotterReport />
              </ProtectedRoute>
            } />
            <Route path="resident/profile" element={
              <ProtectedRoute requiredRoles={[4]}>
                <ResidentProfile />
              </ProtectedRoute>
            } />
            <Route path="resident/complaints" element={
              <ProtectedRoute requiredRoles={[4]}>
                <ComplaintHistory />
              </ProtectedRoute>
            } />

            <Route path="resident/announcements" element={
              <ProtectedRoute requiredRoles={[4]}>
                <ResidentAnnouncements />
              </ProtectedRoute>
            } />

            {/* Secretary Routes */}
            <Route path="secretary/settings" element={
              <ProtectedRoute requiredRoles={[6]}>
                <SecretarySettings />
              </ProtectedRoute>
            } />

                {/* Backward compatibility redirects */}
                <Route path="certificates" element={<Navigate to="documents" replace />} />
                <Route path="document-templates" element={<Navigate to="documents" replace />} />
              </Route>
            </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </ErrorBoundary>
  )
}

export default App
