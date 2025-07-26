const express = require('express');
const cors = require('cors');
const net = require('net');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Main thread - orchestrates both servers
if (isMainThread) {
    console.log('Starting Luna iot server with multi threading...');

    // Create API Server Worker
    const apiWorker = new Worker(__filename, {
        workerData: { type: 'api' }
    });

    // Create TCP Server Worker
    const tcpWorker = new Worker(__filename, {
        workerData: { type: 'tcp' }
    });

    // Handle API Worker Messages
    apiWorker.on('message', (message) => {
        console.log('API Worker Message:', message);
    });

    apiWorker.on('error', (error) => {
        console.log('API Worker Error:', error);
    });

    // Handle TCP Worker messages
    tcpWorker.on('message', (message) => {
        console.log('TCP Server: ', message);
    });

    tcpWorker.on('error', (error) => {
        console.log('TCP Worker Error:', error);
    });

    // Graceful Shutdown
    process.on('SIGINT', () => {
        console.log('Shutting down servers...');
        apiWorker.terminate();
        tcpWorker.terminate();
        process.exit(0);
    });

    console.log('Main thread initialized - both servers starting...');
} else {
    const {type} = workerData;

    if (type === 'api') {
        // API Server Worker
        const app = express();
        const PORT = process.env.API_PORT || 7070;

        // Middleware
        app.use(cors());
        app.use(express.json());
        app.use(express.urlencoded({extended: true}));

        // Health check point
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                server: 'API Server',
                timestamp: new Date().toISOString(),
                thread: 'API Worker'
            });
        });

        app.listen(PORT, () => {
            parentPort.postMessage('API Server running on port ' + PORT);
            console.log('API Server listening on port ' + PORT);
        });
    } else if (type === 'tcp') {
        // TCP Server Worker
        const PORT = process.env.TCP_PORT || 7777;

        const tcpServer = net.createServer((socket) => {

            const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
            parentPort.postMessage(`TCP Client connected: ${clientAddress}`);

            // Handle incoming data
            socket.on('data', (data) => {
                const message = data.toString().trim();
                parentPort.postMessage(`TCP Data received: ${message}`);
                console.log(`TCP Data from ${clientAddress}: ${message}`);

                // Echo back to client
                socket.write(`Server received: ${message}\n`);
            });

            // Handle client disconnect
            socket.on('end', () => {
                parentPort.postMessage(`TCP Client disconnected: ${clientAddress}`);
                console.log(`TCP Client disconnected: ${clientAddress}`);
            });

            // Handle connection errors
            socket.on('error', (err) => {
                parentPort.postMessage(`TCP Client error: ${err.message}`);
                console.log(`TCP Client error: ${err.message}`);
            });
        });

        // Start TCP Server
        tcpServer.listen(PORT, () => {
            parentPort.postMessage('TCP Server running on port ' + PORT);
            console.log('TCP Server listening on port ' + PORT);
        });

        // Handle server errors
        tcpServer.on('error', (err) => {
            parentPort.postMessage(`TCP Server error: ${err.message}`);
        });
    }
}