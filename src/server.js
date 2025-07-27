const cluster = require('cluster');
const os = require('os');
const tcp = require('./tcp/tcp_listener');


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
}  else {
    // This block runs in each worker process
    console.log(`Worker ${process.pid} started...`);

    // Start TCP listener in a worker
    tcp.startServer();
}