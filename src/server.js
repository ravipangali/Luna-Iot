const cluster = require('cluster');
const os = require('os');
const tcp = require('./tcp/tcp_listener');
const prisma = require('./database/prisma');
const express = require('express');
const { errorMiddleware } = require('./api/middleware/error_middleware');
const socketService = require('./socket/socket_service');

// IMPORT Routes
const deviceRoutes = require('./api/routes/device_routes');
const locationRoutes = require('./api/routes/location_routes');
const statusRoutes = require('./api/routes/status_routes');
const vehicleRoutes = require('./api/routes/vehicle_routes');

// Express App
const app = express();
app.use(express.json());

// API Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
app.use('/api', deviceRoutes);
app.use('/api', locationRoutes);
app.use('/api', statusRoutes);
app.use('/api', vehicleRoutes);

// Error Middleware
app.use(errorMiddleware);

// PORTS 
const API_PORT = process.env.API_PORT || 7070;
const TCP_PORT = process.env.TCP_PORT || 7777;


// Number of CPU for Cluster
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    // This block runs in the master process
    console.log(`Master process ${process.pid} is running`);

    // Fork workers (one per CPU core)
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork(); // Create a new worker
    }

    // Listen for dying workers
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Starting a new one...`);
        cluster.fork(); // Replace dead worker
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Shutting down gracefully...');
        await prisma.disconnect();
        process.exit(0);
    });

} else {
    // This block runs in each worker process
    console.log(`Worker ${process.pid} started...`);
    async function startWorker() {
        try {
            // Initialize Prisma in each worker
            await prisma.connect();
            console.log(`Worker ${process.pid}: Prisma connected`);

            // Start HTTP server
            const server = app.listen(API_PORT, () => {
                console.log(`Worker ${process.pid}: API server running on port ${API_PORT}`);
            });

            // Initialize Socket.IO
            socketService.initialize(server);

            // Start TCP listener (only in first worker)
            tcp.startServer(TCP_PORT);

            // Graceful shutdown
            process.on('SIGINT', async () => {
                await prisma.disconnect();
                process.exit(0);
            });

        } catch (error) {
            console.error(`Worker ${process.pid} initialization failed:`, error);
            process.exit(1);
        }
    }

    startWorker();
}