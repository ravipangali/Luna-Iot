const net = require('net')
const tcpHandler = require('./handlers/handler')
const gt06Handler = require('./handlers/gt06_handler')

class TCPListener {
    constructor() {
        this.server = null;
        this.connections = new Map();
    }

    startServer(port = 7777) {
        this.server = net.createServer((socket) => {
            const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
            console.log(`[Worker ${process.pid}] New connection from ${connectionId}`);
            
            // Store connection info
            this.connections.set(connectionId, {
                socket: socket,
                workerId: process.pid,
                connectedAt: new Date(),
                remoteAddress: socket.remoteAddress,
                remotePort: socket.remotePort
            });

            // Handle incoming data
            socket.on('data', (data) => {
                console.log(`[Worker ${process.pid}] Received data from ${connectionId}: `,data.toString('hex'));

                // Data handling
                let datahandler = new tcpHandler.DataHandler();
                datahandler.handleData(data, socket);
            });

            // Handle connection close
            socket.on('close', () => {
                console.log(`[Worker ${process.pid}] Connection closed from ${connectionId}`);
                // Clean up IMEI data for this connection
                gt06Handler.GT06Handler.clearIMEIForConnection(socket);
                this.connections.delete(connectionId);
            });

            // Handle errors
            socket.on('error', (err) => {
                console.error(`[Worker ${process.pid}] Socket error for ${connectionId}: `, err.message);
                // Clean up IMEI data for this connection
                gt06Handler.GT06Handler.clearIMEIForConnection(socket);
                this.connections.delete(connectionId);
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