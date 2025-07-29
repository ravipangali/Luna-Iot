const { Server } = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket) => {
            // Handle Message
            socket.on('send_message', (data) => {
                console.log('Received message:', data);

                // Broadcast message to all client
                this.io.emit('receive_message', {
                    message: data.message,
                    sender: socket.id,
                    timestamp: new Date().toISOString()
                });
            });
        })
    }

    sendMessage(message) {
        if (this.io) {
            this.io.emit('server_message', {
                message: message,
                timestamp: new Date().toISOString()
            });
        }
    }

    _deviceMonitoringMessage(type, imei, lat, lon) {
        console.log('DEVICE MONITORING MSG');
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
                    console.log('status maa puge')
                    data = `${new Date().toISOString()} => STATUS: ${imei} => WRITE SUCCESSFULL`;
                    break;
                case 'imei_not_registered':
                    data = `${new Date().toISOString()} => IMEI NOT REGISTERED: ${imei}`;
                    break;
                default:
            }
            console.log('daa yesto vo: ', data);
            this.io.emit('device_monitoring', { message: data });
        }
    }
}

const socketService = new SocketService();

module.exports = socketService;