const cluster = require('cluster');
const os = require('os');
const tcp = require('./tcp/tcp_listener');
const prisma = require('./database/prisma');


const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    // This block runs in the master process
    console.log(`Master process ${process.pid} is running`);

    // Initialize Prisma in master process
    async function initializePrisma() {
        try {
            await prisma.connect();
            console.log('Prisma initialization completed in master process');
        } catch (error) {
            console.error('Prisma initialization failed:', error);
            process.exit(1);
        }
    }

    await initializePrisma();
    
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
}  else {
    // This block runs in each worker process
    console.log(`Worker ${process.pid} started...`);

    // Start TCP listener in a worker
    tcp.startServer();
}