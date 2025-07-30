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
            socket.on('connect', () => {
                this.connectedClients.add(socket.id);
                console.log('Socket Client Connected: ', socket.id);
            });

            socket.on('disconnect', () => {
                this.connectedClients.delete(socket.id);
                console.log('Socket Client Disconnected: ', socket.id);
            });
        })
    }

    _broadcastToAll(event, data) {
        if (this.io) {
            try {
                this.io.emit(event, data);
                console.log(`📤 Broadcasted ${event} to ${this.connectedClients.size} clients`);
            } catch (error) {
                console.error(`❌ Error broadcasting ${event}:`, error);
            }
        }
    }

    deviceMonitoringMessage(type, imei, lat, lon) {
        console.log('Device monitoring message');
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
            }
            this._broadcastToAll('device_monitoring', data);
        } else {
            console.log('❌ Socket.IO not initialized');
        }
    }

    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
}

const socketService = new SocketService();

module.exports = socketService;