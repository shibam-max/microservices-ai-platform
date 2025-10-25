/**
 * Dashboard Page Component
 */

import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    TrendingUp,
    People,
    Psychology,
    Storage
} from '@mui/icons-material';

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        totalUsers: 1250,
        activePredictions: 45,
        dataProcessed: 15680,
        systemHealth: 'Healthy'
    });
    
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);
    
    const MetricCard = ({ title, value, icon, color = 'primary' }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: `${color}.main`, mr: 1 }}>
                        {icon}
                    </Box>
                    <Typography variant="h6" component="div">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4" component="div" color={`${color}.main`}>
                    {loading ? <CircularProgress size={24} /> : value}
                </Typography>
            </CardContent>
        </Card>
    );
    
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>
            
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Welcome to the Microservices AI Platform
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total Users"
                        value={metrics.totalUsers.toLocaleString()}
                        icon={<People />}
                        color="primary"
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Predictions"
                        value={metrics.activePredictions}
                        icon={<Psychology />}
                        color="secondary"
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Data Processed"
                        value={metrics.dataProcessed.toLocaleString()}
                        icon={<Storage />}
                        color="success"
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TrendingUp sx={{ color: 'info.main', mr: 1 }} />
                                <Typography variant="h6" component="div">
                                    System Health
                                </Typography>
                            </Box>
                            <Chip
                                label={metrics.systemHealth}
                                color="success"
                                variant="outlined"
                                size="large"
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            
            <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Recent Activity
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Real-time system activity and events will be displayed here.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quick Actions
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Common tasks and shortcuts will be available here.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;