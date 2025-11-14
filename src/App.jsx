
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="content-area">
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
    </Router>
  );
}

export default App;
