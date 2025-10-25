/**
 * Navigation Bar Component
 */

import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Badge,
    Box,
    Chip
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    AccountCircle,
    CloudDone,
    CloudOff
} from '@mui/icons-material';
import { useNotifications } from '../services/notificationContext';

const Navbar = ({ onSidebarToggle, connected }) => {
    const { unreadCount } = useNotifications();
    
    return (
        <AppBar position="static" sx={{ zIndex: 1201 }}>
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={onSidebarToggle}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Microservices AI Platform
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Connection Status */}
                    <Chip
                        icon={connected ? <CloudDone /> : <CloudOff />}
                        label={connected ? 'Connected' : 'Disconnected'}
                        color={connected ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                        sx={{ color: 'white', borderColor: 'white' }}
                    />
                    
                    {/* Notifications */}
                    <IconButton color="inherit">
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    
                    {/* User Profile */}
                    <IconButton color="inherit">
                        <AccountCircle />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;