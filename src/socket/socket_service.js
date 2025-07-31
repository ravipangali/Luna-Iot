const { Server } = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedClients = new Set();
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true,
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.io.on('connection', (socket) => {
            this.connectedClients.add(socket.id);
            console.log(`[Worker ${process.pid}] Socket Client Connected: ${socket.id}`);
            console.log(`[Worker ${process.pid}] Total connected clients: ${this.connectedClients.size}`);

            socket.on('disconnect', () => {
                this.connectedClients.delete(socket.id);
                console.log(`[Worker ${process.pid}] Socket Client Disconnected: ${socket.id}`);
                console.log(`[Worker ${process.pid}] Total connected clients: ${this.connectedClients.size}`);
            });
        });
    }

    _broadcastToAll(event, data) {
        if (this.io) {
            try {
                // ALWAYS broadcast - Socket.IO will handle routing to connected clients
                this.io.emit(event, data);
                console.log(`[Worker ${process.pid}] 📤 Broadcasted ${event} to all connected clients`);
            } catch (error) {
                console.error(`[Worker ${process.pid}] ❌ Error broadcasting ${event}:`, error);
            }
        }
    }

    deviceMonitoringMessage(type, imei, lat, lon) {
        console.log(`[Worker ${process.pid}] Device monitoring message`);
        if (this.io) {
            var data;
            switch (type) {
                case 'connected':
                    data = `${new Date().toISOString()} => INCOMING CLIENT`;
                    break;
                case 'disconnected':
                    data = `${new Date().toISOString()} => CLIENT DISCONNECTED`;
                    break;
                case 'location':
                    data = `${new Date().toISOString()} => LOCATION: ${imei} => Lat: ${lat} | Lon: ${lon}`;
                    break;
                case 'login':
                    data = `${new Date().toISOString()} => LOGIN: ${imei}`;
                    break;
                case 'status':
                    data = `${new Date().toISOString()} => STATUS: ${imei} => WRITE SUCCESSFULL`;
                    break;
                case 'imei_not_registered':
                    data = `${new Date().toISOString()} => IMEI NOT REGISTERED: ${imei}`;
                    break;
                default:
                    return; // Don't broadcast if type is not recognized
            }
            this._broadcastToAll('device_monitoring', data);
        } else {
            console.log(`[Worker ${process.pid}] ❌ Socket.IO not initialized`);
        }
    }

    getConnectedClientsCount() {
        return this.io ? this.io.engine.clientsCount : 0;
    }
}

const socketService = new SocketService();

module.exports = socketService;