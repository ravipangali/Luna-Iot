const {Server} = require('socket.io');

class SocketService {
    constructor () {
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
}

const socketService = new SocketService();

module.exports = socketService;