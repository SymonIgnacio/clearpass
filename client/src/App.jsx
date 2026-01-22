import { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';

// Eager load critical components
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useThemeMode } from './contexts/ThemeModeContext.jsx';

// Import critical pages directly to avoid dynamic import issues
import Login from './pages/Login';
import ResidentLogin from './pages/ResidentLogin';
import ResidentRegister from './pages/ResidentRegister';
import OfficerLogin from './pages/OfficerLogin';
import Unauthorized from './pages/Unauthorized';
import MfaOtp from './pages/MfaOtp';
import VerifyEmail from './pages/VerifyEmail';

// Enhanced lazy loading with loading states and error boundaries
const Dashboard = lazy(() => import('./pages/Dashboard').catch(() => import('./pages/ErrorPage')));
const ResidentDashboard = lazy(() =>
  import('./pages/ResidentDashboard').catch(() => import('./pages/ErrorPage'))
);
const Residents = lazy(() => import('./pages/Residents').catch(() => import('./pages/ErrorPage')));
const Blotter = lazy(() => import('./pages/Blotter').catch(() => import('./pages/ErrorPage')));
const DocumentsDashboard = lazy(() =>
  import('./pages/DocumentsDashboard').catch(() => import('./pages/ErrorPage'))
);
const Census = lazy(() => import('./pages/Census'));
const CommunityEvents = lazy(() => import('./pages/CommunityEvents'));
const Settings = lazy(() => import('./pages/Settings'));
const CertificateRequest = lazy(() => import('./pages/CertificateRequest'));
const RequestHistory = lazy(() => import('./pages/RequestHistory'));
const AdminBackup = lazy(() => import('./pages/AdminBackup'));
const ResidentAnnouncements = lazy(() => import('./pages/ResidentAnnouncements'));
const CaseDetail = lazy(() => import('./pages/CaseDetail'));
const Requests = lazy(() => import('./pages/Requests'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));
const ResidentProfile = lazy(() => import('./pages/ResidentProfile'));
const ComplaintHistory = lazy(() => import('./pages/ComplaintHistory'));
const ResidentDocuments = lazy(() => import('./pages/ResidentDocuments'));
const ResidentCertificates = lazy(() => import('./pages/ResidentCertificates'));
const ResidentBlotterReport = lazy(() => import('./pages/ResidentBlotterReport'));
const SystemLogs = lazy(() => import('./pages/admin/SystemLogs'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const SecretarySettings = lazy(() => import('./pages/SecretarySettings'));
const AccountVerification = lazy(() => import('./components/AccountVerification'));
const BeneficiaryValidation = lazy(() => import('./pages/BeneficiaryValidation'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const DocumentVerification = lazy(() => import('./pages/DocumentVerification'));
const ResidencyVerification = lazy(() => import('./pages/admin/ResidencyVerification'));
const QRCodeGenerator = lazy(() => import('./pages/QRCodeGenerator'));

const ClerkDashboard = lazy(() => import('./pages/dashboards/ClerkDashboard'));
const BlotterDashboard = lazy(() => import('./pages/dashboards/BlotterDashboard'));

// Role-based dashboard redirector
const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (user && (parseInt(user.role) === 12 || parseInt(user.role) === 13)) {
    return <Navigate to='/resident/dashboard' replace />;
  }

  return <Dashboard />;
};

// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

const createAppTheme = mode => {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
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
        default: isDark ? '#121212' : '#f8f9fa',
        paper: isDark ? '#1e1e1e' : '#ffffff', // Slightly lighter for paper in dark mode
      },
      text: {
        primary: isDark ? '#ffffff' : '#202124', // Pure white for max contrast
        secondary: isDark ? '#b0b3b8' : '#5f6368', // Lighter grey for secondary
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e8eaed',
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
            border: isDark ? '1px solid #3c4043' : '1px solid #e8eaed',
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
                borderColor: isDark ? '#5f6368' : '#dadce0',
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#9aa0a6' : '#bdc1c6',
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
            backgroundColor: isDark ? '#202124' : '#ffffff',
            color: isDark ? '#e8eaed' : '#202124',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            borderRight: isDark ? '1px solid #3c4043' : '1px solid #e8eaed',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active':
            {
              WebkitBoxShadow: `0 0 0 1000px ${isDark ? '#1f1f1f' : '#ffffff'} inset !important`,
              WebkitTextFillColor: `${isDark ? '#e8eaed' : '#202124'} !important`,
              caretColor: isDark ? '#e8eaed' : '#202124',
              transition: 'background-color 5000s ease-in-out 0s',
            },
        },
      },
    },
  });
};

function App() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

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
                  <Route path='/login' element={<Login />} />
                  <Route path='/resident/login' element={<ResidentLogin />} />
                  <Route path='/resident/register' element={<ResidentRegister />} />
                  <Route path='/signup' element={<ResidentRegister />} />
                  <Route path='/officerlogin' element={<OfficerLogin />} />
                  <Route path='/verify-account' element={<AccountVerification />} />
                  <Route path='/unauthorized' element={<Unauthorized />} />
                  <Route
                    path='/mfa'
                    element={
                      <ProtectedRoute>
                        <MfaOtp />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path='/mfa-otp'
                    element={
                      <ProtectedRoute>
                        <MfaOtp />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path='/guest/verify-email'
                    element={
                      <ProtectedRoute>
                        <VerifyEmail />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Layout Route */}
                  <Route
                    path='/'
                    element={
                      <ProtectedRoute>
                        <AppShell>
                          <Outlet />
                        </AppShell>
                      </ProtectedRoute>
                    }
                  >
                    {/* Nested protected routes */}
                    <Route index element={<RoleBasedDashboard />} />

                    {/* Role-specific dashboard routes */}
                    <Route path='admin/dashboard' element={<Dashboard />} />
                    <Route path='secretary/dashboard' element={<Dashboard />} />
                    <Route
                      path='clerk/dashboard'
                      element={
                        <ProtectedRoute requiredRoles={[1, 4]}>
                          <ClerkDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='officer/dashboard'
                      element={
                        <ProtectedRoute requiredRoles={[1, 6]}>
                          <BlotterDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='dashboard'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 3, 4, 6]}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='residents'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 3, 4]}>
                          <Residents />
                        </ProtectedRoute>
                      }
                    />
                    <Route path='users' element={<Navigate to='residents' replace />} />
                    <Route
                      path='blotter'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 4, 6]}>
                          <Blotter />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='documents'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 3, 4, 6]}>
                          <DocumentsDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='census'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 3, 4, 6]}>
                          <Census />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='events'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 3, 6, 12, 13]}>
                          <CommunityEvents />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='admin/settings'
                      element={
                        <ProtectedRoute requiredRoles={[1]}>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='reports'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 3]}>
                          <AdminReports />
                        </ProtectedRoute>
                      }
                    />

                    {/* Legacy redirects */}
                    <Route path='qr-verify' element={<Navigate to='/' replace />} />
                    <Route path='qr-verification' element={<Navigate to='/' replace />} />

                    {/* Clerk Routes */}
                    <Route
                      path='clerk/documents'
                      element={
                        <ProtectedRoute requiredRoles={[1, 4]}>
                          <DocumentsDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Officer Routes */}
                    <Route
                      path='officer/case/:caseId'
                      element={
                        <ProtectedRoute requiredRoles={[1, 6]}>
                          <CaseDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='officer/requests'
                      element={
                        <ProtectedRoute requiredRoles={[1, 6]}>
                          <Requests />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='officer/request/:id'
                      element={
                        <ProtectedRoute requiredRoles={[1, 6]}>
                          <RequestDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='officer/new-case'
                      element={
                        <ProtectedRoute requiredRoles={[1, 6]}>
                          <Navigate to='/blotter?new=1' replace />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes - IT Admin Only */}
                    <Route
                      path='admin/staff'
                      element={
                        <ProtectedRoute requiredRoles={[1]}>
                          <StaffManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route path='admin/users' element={<Navigate to='staff' replace />} />
                    <Route
                      path='admin/logs'
                      element={
                        <ProtectedRoute requiredRoles={[1]}>
                          <SystemLogs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='admin/backup'
                      element={
                        <ProtectedRoute requiredRoles={[1]}>
                          <AdminBackup />
                        </ProtectedRoute>
                      }
                    />

                    {/* Resident Routes */}
                    <Route
                      path='resident/dashboard'
                      element={
                        <ProtectedRoute requiredRoles={[12, 13]}>
                          <ResidentDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='resident/request-certificate'
                      element={
                        <ProtectedRoute requiredRoles={[12, 13]}>
                          <ResidentCertificates />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='resident/create-request'
                      element={
                        <ProtectedRoute requiredRoles={[12, 13]}>
                          <CertificateRequest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='resident/requests'
                      element={
                        <ProtectedRoute requiredRoles={[12]}>
                          <RequestHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='resident/blotter-report'
                      element={
                        <ProtectedRoute requiredRoles={[12, 13]}>
                          <ResidentBlotterReport />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='resident/profile'
                      element={
                        <ProtectedRoute requiredRoles={[12]}>
                          <ResidentProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='resident/complaints'
                      element={
                        <ProtectedRoute requiredRoles={[12]}>
                          <ComplaintHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='resident/documents'
                      element={
                        <ProtectedRoute requiredRoles={[12, 13]}>
                          <ResidentDocuments />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='resident/announcements'
                      element={
                        <ProtectedRoute requiredRoles={[12]}>
                          <ResidentAnnouncements />
                        </ProtectedRoute>
                      }
                    />

                    {/* Secretary Routes */}
                    <Route
                      path='secretary/document-verification'
                      element={
                        <ProtectedRoute requiredRoles={[1, 3, 4]}>
                          <DocumentVerification />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='secretary/residency-verification'
                      element={
                        <ProtectedRoute requiredRoles={[1, 3]}>
                          <ResidencyVerification />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='secretary/beneficiaries'
                      element={
                        <ProtectedRoute requiredRoles={[1, 3]}>
                          <BeneficiaryValidation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='secretary/settings'
                      element={
                        <ProtectedRoute requiredRoles={[1, 3]}>
                          <SecretarySettings />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='qr-generator'
                      element={
                        <ProtectedRoute requiredRoles={[1, 2, 3]}>
                          <QRCodeGenerator />
                        </ProtectedRoute>
                      }
                    />

                    {/* Backward compatibility redirects */}
                    <Route path='certificates' element={<Navigate to='documents' replace />} />
                    <Route
                      path='document-templates'
                      element={<Navigate to='documents' replace />}
                    />

                    {/* Catch-all for 404 */}
                    <Route path='*' element={<Navigate to='/' replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
