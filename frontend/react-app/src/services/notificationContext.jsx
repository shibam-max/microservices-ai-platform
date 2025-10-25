/**
 * Notification Context for managing real-time notifications
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { socketService } from './socketService';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

const initialState = {
    notifications: [],
    unreadCount: 0,
    connected: false
};

const notificationReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [action.payload, ...state.notifications],
                unreadCount: state.unreadCount + 1
            };
        case 'MARK_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(notification =>
                    notification.id === action.payload
                        ? { ...notification, read: true }
                        : notification
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            };
        case 'SET_NOTIFICATIONS':
            return {
                ...state,
                notifications: action.payload,
                unreadCount: action.payload.filter(n => !n.read).length
            };
        case 'SET_CONNECTED':
            return {
                ...state,
                connected: action.payload
            };
        default:
            return state;
    }
};

export const NotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);
    
    useEffect(() => {
        // Listen for real-time notifications
        socketService.on('notification', (notification) => {
            dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
            
            // Show toast notification
            toast.success(notification.title || 'New notification', {
                duration: 4000,
                position: 'top-right'
            });
        });
        
        socketService.on('connect', () => {
            dispatch({ type: 'SET_CONNECTED', payload: true });
        });
        
        socketService.on('disconnect', () => {
            dispatch({ type: 'SET_CONNECTED', payload: false });
        });
        
        return () => {
            socketService.off('notification');
            socketService.off('connect');
            socketService.off('disconnect');
        };
    }, []);
    
    const markAsRead = (notificationId) => {
        dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    };
    
    const setNotifications = (notifications) => {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    };
    
    const value = {
        ...state,
        markAsRead,
        setNotifications
    };
    
    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};