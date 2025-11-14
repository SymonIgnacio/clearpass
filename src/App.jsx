
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Households from './pages/Households';
import Blotter from './pages/Blotter';
import Certificates from './pages/Certificates';
import Analytics from './pages/Analytics';
import Announcements from './pages/Announcements';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Header />
            <div style={{ display: 'flex' }}>
              <Sidebar />
              <div className="content-area" style={{ flex: 1, padding: '2rem', marginTop: '64px' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/residents" element={<Residents />} />
                  <Route path="/households" element={<Households />} />
                  <Route path="/blotter" element={<Blotter />} />
                  <Route path="/certificates" element={<Certificates />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/announcements" element={<Announcements />} />
                </Routes>
              </div>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
