const net = require('net');

class TCPService {
    constructor() {
        this.connections = new Map();
        this.deviceConnections = new Map(); // Track by IMEI
        this.reconnectionAttempts = new Map();
        this.maxReconnectionAttempts = 3;
        this.reconnectionDelay = 5000; // 5 seconds
    }

    // Add connection with device info
    addConnection(connectionId, socket, deviceInfo = {}) {
        const connection = {
            connectionId,
            socket,
            deviceInfo,
            lastSeen: Date.now(),
            isConnected: true
        };
        
        this.connections.set(connectionId, connection);
        
        // Also track by IMEI for easier lookup
        if (deviceInfo.imei) {
            this.deviceConnections.set(deviceInfo.imei, connection);
            console.log(`Device connected by IMEI: ${deviceInfo.imei}`);
        }
        
        console.log(`Device connected: ${connectionId}`, deviceInfo);
    }

    // Remove connection
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.deviceInfo.imei) {
            this.deviceConnections.delete(connection.deviceInfo.imei);
            console.log(`Device disconnected by IMEI: ${connection.deviceInfo.imei}`);
        }
        
        this.connections.delete(connectionId);
        console.log(`Device disconnected: ${connectionId}`);
    }

    // Check if device is connected by IMEI
    isDeviceConnected(imei) {
        const connection = this.deviceConnections.get(imei);
        return connection && connection.isConnected && !connection.socket.destroyed;
    }

    // Get device connection info
    getDeviceConnection(imei) {
        return this.deviceConnections.get(imei);
    }

    // Update device info (when ignition status changes)
    updateDeviceInfo(imei, newInfo) {
        const connection = this.deviceConnections.get(imei);
        if (connection) {
            connection.deviceInfo = { ...connection.deviceInfo, ...newInfo };
            connection.lastSeen = Date.now();
            console.log(`Device info updated for ${imei}:`, newInfo);
        }
    }

    // Update device last seen
    updateDeviceLastSeen(imei) {
        const connection = this.deviceConnections.get(imei);
        if (connection) {
            connection.lastSeen = Date.now();
            console.log(`Device last seen updated for ${imei}`);
        }
    }

    // Get all connected devices
    getConnectedDevices() {
        const devices = [];
        for (const [imei, connection] of this.deviceConnections) {
            if (connection.isConnected && !connection.socket.destroyed) {
                devices.push({
                    imei: imei,
                    lastSeen: connection.lastSeen,
                    isConnected: connection.isConnected,
                    deviceInfo: connection.deviceInfo
                });
            }
        }
        return devices;
    }

    // Debug method to see all connections
    debugConnections() {
        console.log('=== TCP CONNECTIONS DEBUG ===');
        console.log('Total connections:', this.connections.size);
        console.log('Device connections by IMEI:', this.deviceConnections.size);
        
        for (const [imei, connection] of this.deviceConnections) {
            console.log(`IMEI: ${imei}`);
            console.log(`  Connected: ${connection.isConnected}`);
            console.log(`  Socket destroyed: ${connection.socket.destroyed}`);
            console.log(`  Last seen: ${new Date(connection.lastSeen)}`);
            console.log(`  Device info:`, connection.deviceInfo);
        }
    }
}

module.exports = new TCPService();