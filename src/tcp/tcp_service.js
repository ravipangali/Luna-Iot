const net = require('net');

class TCPService {
    constructor() {
        this.connections = new Map();
    }

    // Check if device is connected
    isDeviceConnected(imei) {
        for (const [id, connection] of this.connections) {
            if (connection.deviceImei === imei) {
                return true;
            }
        }
        return false;
    }

    // Get connection info for device
    getDeviceConnection(imei) {
        for (const [id, connection] of this.connections) {
            if (connection.deviceImei === imei) {
                return connection;
            }
        }
        return null;
    }

    // Add this method to debug connection issues
    getConnectedDevicesDebug() {
        console.log('=== TCP CONNECTIONS DEBUG ===');
        console.log('Total connections:', this.connections.size);

        for (const [id, connection] of this.connections) {
            console.log(`Connection ID: ${id}`);
            console.log(`Device IMEI: ${connection.deviceImei}`);
            console.log(`Remote Address: ${connection.remoteAddress}`);
            console.log(`Connected At: ${connection.connectedAt}`);
            console.log('---');
        }

        return this.getConnectedDevices();
    }

    // Send command to specific device
    async sendCommand(imei, command) {
        try {
            // Find the TCP connection for this device
            const connection = this.findConnectionByImei(imei);

            if (!connection) {
                return { success: false, error: 'Device not connected' };
            }

            // Send command
            const result = await this.sendCommandToConnection(connection, command);
            return result;
        } catch (error) {
            console.error('Error sending command:', error);
            return { success: false, error: error.message };
        }
    }

    // Find connection by IMEI
    findConnectionByImei(imei) {
        for (const [id, connection] of this.connections) {
            if (connection.deviceImei === imei) {
                return connection;
            }
        }
        return null;
    }

    // Send command to specific connection
    async sendCommandToConnection(connection, command) {
        return new Promise((resolve, reject) => {
            try {
                // Add command to connection
                connection.socket.write(command, (error) => {
                    if (error) {
                        console.error('Error writing command:', error);
                        resolve({ success: false, error: error.message });
                    } else {
                        console.log(`Command sent to ${connection.deviceImei}: ${command}`);
                        resolve({ success: true, message: 'Command sent successfully' });
                    }
                });
            } catch (error) {
                resolve({ success: false, error: error.message });
            }
        });
    }

    // Store connection with device IMEI
    storeConnection(connectionId, connectionData) {
        this.connections.set(connectionId, connectionData);
    }

    // Remove connection
    removeConnection(connectionId) {
        this.connections.delete(connectionId);
    }

    // Get all connected devices
    getConnectedDevices() {
        const devices = [];
        for (const [id, connection] of this.connections) {
            if (connection.deviceImei) {
                devices.push({
                    imei: connection.deviceImei,
                    connectedAt: connection.connectedAt,
                    remoteAddress: connection.remoteAddress,
                    remotePort: connection.remotePort
                });
            }
        }
        return devices;
    }
}

module.exports = new TCPService();