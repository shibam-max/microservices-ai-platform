/**
 * Sidebar Navigation Component
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Typography
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Psychology as PsychologyIcon,
    Analytics as AnalyticsIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users' },
    { text: 'ML Predictions', icon: <PsychologyIcon />, path: '/ml-predictions' },
    { text: 'Data Analytics', icon: <AnalyticsIcon />, path: '/data-analytics' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
];

const Sidebar = ({ open }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleNavigation = (path) => {
        navigate(path);
    };
    
    return (
        <Drawer
            variant="persistent"
            anchor="left"
            open={open}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" component="div" color="primary">
                    AI Platform
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    XYZ Dev Foundation
                </Typography>
            </Box>
            
            <Divider />
            
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            
            <Divider />
            
            <List>
                <ListItem disablePadding>
                    <ListItemButton>
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    );
};

export default Sidebar;