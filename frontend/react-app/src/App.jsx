/**
 * Main React Application Component
 * 
 * Demonstrates XYZ Dev Foundation requirements:
 * - ReactJS with modern hooks and context
 * - Real-time WebSocket integration
 * - Material-UI for professional design
 * - API integration with microservices
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import MLPredictions from './pages/MLPredictions';
import DataAnalytics from './pages/DataAnalytics';
import Notifications from './pages/Notifications';

// Services
import { socketService } from './services/socketService';
import { NotificationProvider } from './services/notificationContext';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    socketService.connect();
    
    socketService.on('connect', () => {
      console.log('Connected to notification service');
      setConnected(true);
    });
    
    socketService.on('disconnect', () => {
      console.log('Disconnected from notification service');
      setConnected(false);
    });
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              {/* Sidebar */}
              <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
              
              {/* Main Content */}
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: theme.transitions.create(['margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  }),
                  marginLeft: sidebarOpen ? 0 : '-240px',
                }}
              >
                {/* Top Navigation */}
                <Navbar 
                  onSidebarToggle={handleSidebarToggle}
                  connected={connected}
                />
                
                {/* Page Content */}
                <Box sx={{ flexGrow: 1, p: 3 }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/ml-predictions" element={<MLPredictions />} />
                    <Route path="/data-analytics" element={<DataAnalytics />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Routes>
                </Box>
              </Box>
            </Box>
            
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;