const net = require('net');

class TCPService {
    constructor() {
        this.connections = new Map();
        this.deviceConnections = new Map(); // Track by IMEI
        this.reconnectionAttempts = new Map();
        this.maxReconnectionAttempts = 3;
        this.reconnectionDelay = 5000; // 5 seconds
    }

    // Add connection with device info (this is the method that was missing)
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
        } else {
            // If no connection found, create a placeholder
            console.log(`Creating placeholder connection for device: ${imei}`);
            this.deviceConnections.set(imei, {
                connectionId: `placeholder_${imei}`,
                socket: null,
                deviceInfo: { imei, ...newInfo },
                lastSeen: Date.now(),
                isConnected: false
            });
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
            if (connection.isConnected && (!connection.socket || !connection.socket.destroyed)) {
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
            console.log(`  Socket destroyed: ${connection.socket ? connection.socket.destroyed : 'No socket'}`);
            console.log(`  Last seen: ${new Date(connection.lastSeen)}`);
            console.log(`  Device info:`, connection.deviceInfo);
        }
    }

    // Attempt to reconnect device
    async attemptDeviceReconnection(imei) {
        console.log(`Attempting to reconnect device: ${imei}`);
        
        // Check if we're already attempting reconnection
        if (this.reconnectionAttempts.has(imei)) {
            const attempts = this.reconnectionAttempts.get(imei);
            if (attempts.count >= this.maxReconnectionAttempts) {
                console.log(`Max reconnection attempts reached for device: ${imei}`);
                return false;
            }
        }

        // Initialize reconnection tracking
        if (!this.reconnectionAttempts.has(imei)) {
            this.reconnectionAttempts.set(imei, { count: 0, lastAttempt: 0 });
        }

        const reconnectionInfo = this.reconnectionAttempts.get(imei);
        const now = Date.now();

        // Check if enough time has passed since last attempt
        if (now - reconnectionInfo.lastAttempt < this.reconnectionDelay) {
            console.log(`Reconnection attempt too soon for device: ${imei}`);
            return false;
        }

        try {
            // Increment attempt count
            reconnectionInfo.count++;
            reconnectionInfo.lastAttempt = now;

            console.log(`Reconnection attempt ${reconnectionInfo.count} for device: ${imei}`);

            // For now, we'll simulate a reconnection attempt
            // In a real implementation, you might send a ping command
            await this.sendReconnectionCommand(imei);

            // Wait a bit to see if device responds
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check if device is now connected
            if (this.isDeviceConnected(imei)) {
                console.log(`Device reconnected successfully: ${imei}`);
                this.reconnectionAttempts.delete(imei);
                return true;
            } else {
                console.log(`Reconnection attempt failed for device: ${imei}`);
                return false;
            }

        } catch (error) {
            console.error(`Error during reconnection attempt for device ${imei}:`, error);
            return false;
        }
    }

    // Send reconnection command to device
    async sendReconnectionCommand(imei) {
        try {
            // This would be your actual reconnection command
            const reconnectionCommand = this.buildReconnectionCommand(imei);
            
            // Find the device's last known connection and try to send command
            const connection = this.getDeviceConnection(imei);
            if (connection && connection.socket && !connection.socket.destroyed) {
                connection.socket.write(reconnectionCommand);
                console.log(`Reconnection command sent to device: ${imei}`);
            } else {
                console.log(`No valid connection found for device: ${imei}`);
            }
        } catch (error) {
            console.error(`Error sending reconnection command to device ${imei}:`, error);
        }
    }

    // Build reconnection command (customize based on your device protocol)
    buildReconnectionCommand(imei) {
        // This is a placeholder - customize based on your GT06 protocol
        return Buffer.from(`RECONNECT_${imei}\n`);
    }

    // Send relay command to device
    async sendRelayCommand(imei, command) {
        try {
            const connection = this.getDeviceConnection(imei);
            
            if (!connection || !connection.isConnected) {
                return { success: false, error: 'Device not connected' };
            }

            if (!connection.socket || connection.socket.destroyed) {
                return { success: false, error: 'Socket connection invalid' };
            }

            // Build relay command based on your device protocol
            const relayCommand = this.buildRelayCommand(imei, command);
            
            // Send command to device
            connection.socket.write(relayCommand);
            
            console.log(`Relay command sent to device ${imei}: ${command}`);
            
            // Update last seen timestamp
            this.updateDeviceLastSeen(imei);
            
            return { success: true, command: command };
            
        } catch (error) {
            console.error(`Error sending relay command to device ${imei}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Build relay command (customize based on your GT06 protocol)
    buildRelayCommand(imei, command) {
        if (command === 'ON') {
            return Buffer.from(`RELAY_ON_${imei}\n`);
        } else if (command === 'OFF') {
            return Buffer.from(`RELAY_OFF_${imei}\n`);
        } else {
            throw new Error(`Invalid relay command: ${command}`);
        }
    }

    // Clean up old reconnection attempts
    cleanupReconnectionAttempts() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000; // 30 minutes

        for (const [imei, info] of this.reconnectionAttempts) {
            if (now - info.lastAttempt > timeout) {
                this.reconnectionAttempts.delete(imei);
            }
        }
    }
}

module.exports = new TCPService();