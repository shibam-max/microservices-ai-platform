/**
 * WebSocket Service for real-time communication
 */

import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }
    
    connect() {
        const serverUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8084';
        
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
        });
        
        this.socket.on('connect', () => {
            console.log('Connected to notification service');
            this.connected = true;
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from notification service');
            this.connected = false;
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
        
        return this.socket;
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }
    
    joinUserRoom(userId) {
        if (this.socket) {
            this.socket.emit('join', userId);
        }
    }
    
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }
    
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
    
    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }
}

export const socketService = new SocketService();