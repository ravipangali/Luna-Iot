const { Server } = require('socket.io');

class SocketService {

    constructor() {
        this.io = null;
        this.connectedDevices = new Map();
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`Socket client connected: ${socket.id}`);
            // Join monitoring room
            socket.join('device-monitoring');

            socket.on('disconnect', () => {
                console.log(`Socket client disconneted: ${socket.id}`);
                this.connectedDevices.delete(socket.id);
            });
        });

        console.log('Socket.IO server initialized');
    }


    // Emit device connection event
    emitDeviceConneted(imei, deviceInfo) {
        if (this.io) {
            this.connectedDevices.set(imei, {
                ...deviceInfo,
                connectedAt: new Date(),
                lastSeen: new Date()
            });

            this.io.to('device-monitoring').emit('device-connected', {
                imei,
                deviceInfo,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Emit device disconnection event
    emitDeviceDisconnected(imei) {
        if (this.io) {
            this.connectedDevices.delete(imei);

            this.io.to('device-monitoring').emit('device-disconnected', {
                imei,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Emit device data update
    emitLocationUpdate(imei, locationData) {
        if (this.io) {
            this.io.to('device-monitoring').emit('location-update', {
                imei,
                locationData,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Emit status update
    emitStatusUpdate(imei, statusData) {
        if (this.io) {
            this.io.to('device-monitoring').emit('status_update', {
                imei,
                status: statusData,
                timestamp: new Date().toISOString()
            });
        }
    }

    
    // Get connected devices
    getConnectedDevices() {
        return Array.from(this.connectedDevices.entries()).map(([imei, info]) => ({
            imei,
            ...info
        }));
    }

    // Update device last seen
    updateDeviceLastSeen(imei) {
        const device = this.connectedDevices.get(imei);
        if (device) {
            device.lastSeen = new Date();
            this.connectedDevices.set(imei, device);
        }
    }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = socketService;