const net = require('net')
const tcpHandler = require('./handlers/handler')
const socketService = require('../socket/socket_service');
const tcpService = require('./tcp_service');

class TCPListener {
    constructor() {
        this.server = null;
        this.connections = new Map();
    }

    startServer(port = 7777) {
        this.server = net.createServer((socket) => {
            const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
            socketService.deviceMonitoringMessage('connected', null, null, null);
            
            // Store connection info
            const connectionData = {
                socket: socket,
                workerId: process.pid,
                connectedAt: new Date(),
                remoteAddress: socket.remoteAddress,
                remotePort: socket.remotePort,
                deviceImei: null // Initialize as null
            };

            this.connections.set(connectionId, connectionData);
            tcpService.storeConnection(connectionId, connectionData);

            // Handle incoming data
            socket.on('data', (data) => {
                // Data handling
                let datahandler = new tcpHandler.DataHandler();
                datahandler.handleData(data, socket);

                 // Update device IMEI in connection data
                 if (socket.deviceImei) {
                    connectionData.deviceImei = socket.deviceImei;
                    tcpService.storeConnection(connectionId, connectionData);
                    
                    // Debug log
                    console.log(`🔗 TCP Connection updated with IMEI: ${socket.deviceImei}`);
                    console.log(`�� Total connections: ${tcpService.getConnectedDevices().length}`);
                }
            });

            // Handle connection close
            socket.on('close', () => {
                socketService.deviceMonitoringMessage('disconnected', null, null, null);
                this.connections.delete(connectionId);
                tcpService.removeConnection(connectionId);
                console.log(`🔌 TCP Connection closed: ${connectionId}`);
            });
            
            // Handle errors
            socket.on('error', (err) => {
                socketService.deviceMonitoringMessage('disconnected', null, null, null);
                console.error(`${new Date().toISOString} => CLIENT ERROR =>`, err.message);
                this.connections.delete(connectionId);
                tcpService.removeConnection(connectionId);
            });
        });

        this.server.listen(port, () => {
            console.log(`[Worker ${process.pid}] TCP server listening on port ${port}`);
        });

        this.server.on('error', (err) => {
            console.error(`[Worker ${process.pid}] Server error: `, err.message);
        });
    }

    getConnectionCount() {
        return this.connections.size;
    }

    getConnections() {
        return Array.from(this.connections.keys());
    }
}

// Create singleton instance
const tcpListener = new TCPListener();

// Export fucntions
function startServer(port = 7777) {
    tcpListener.startServer(port);
}

function getConnectionCount() {
    return tcpListener.getConnectionCount();
}

function getConnections() {
    return tcpListener.getConnections();
}

module.exports= {
    startServer,
    getConnectionCount,
    getConnections
}