const net = require('net');

class TCPService {
    constructor() {
        this.connections = new Map();
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

    // Check if device is connected by IMEI
    isDeviceConnected(imei) {
        const connection = this.findConnectionByImei(imei);
        return connection && connection.socket && !connection.socket.destroyed;
    }

    // Send relay command to device
    async sendRelayCommand(imei, command) {
        try {
            const connection = this.findConnectionByImei(imei);
            
            if (!connection) {
                return { success: false, error: 'Device not connected' };
            }

            if (!connection.socket || connection.socket.destroyed) {
                return { success: false, error: 'Socket connection invalid' };
            }

            // Build relay command based on your GT06 protocol
            let relayCommand;
            if (command === 'ON') {
                relayCommand = Buffer.from('HFYD#\n'); // Your ON command
            } else if (command === 'OFF') {
                relayCommand = Buffer.from('DYD#\n');  // Your OFF command
            } else {
                throw new Error(`Invalid relay command: ${command}`);
            }
            
            // Send command to device
            connection.socket.write(relayCommand);
            
            console.log(`Relay command sent to device ${imei}: ${command}`);
            
            return { success: true, command: command };
            
        } catch (error) {
            console.error(`Error sending relay command to device ${imei}:`, error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new TCPService();