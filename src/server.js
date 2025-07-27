const cluster = require('cluster');
const os = require('os');
const net = require('net');
const Gt06 = require('gt06');

const TCP_PORT = process.env.TCP_PORT || 7777;
const WORKERS = os.cpus().length;

console.log('WORKERS CPU LENGth: ', WORKERS);

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    // Fork Workers
    for (let i =0 ; i < WORKERS; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

} else {
    // Worker process have their own server
    const server = net.createServer();
    var gt06 = new Gt06();
    

    server.on('connection', (socket) => {
        socket.setKeepAlive(true);

        socket.on('data', (data) => {
            try {
                console.log('Raw data: ', data.toString('hex'));
                // --- Step 1: Replace 7979 with 7878 if detected at start ---
                if (data[0] === 0x79 && data[1] === 0x79) {
                    const modified = Buffer.from(data); // Copy the original buffer
                    modified[0] = 0x78;
                    modified[1] = 0x78;
                    data = modified;
                }
                
                console.log('Modified Raw data: ', data.toString('hex'));
          
                // --- Step 2: Try parsing with gt06 ---
                gt06.parse(data);
              } catch (e) {
                console.log('err', e);
                return;
              }
          
              if (gt06.expectsResponse) {
                socket.write(gt06.responseMsg);
              }
          
              gt06.msgBuffer.forEach(msg => {
                console.log(msg);
              });
          
              gt06.clearMsgBuffer();
        });

        socket.on('error', (err) => {
            console.error('Socket error: ',err.message);
        });
    });

    server.listen(TCP_PORT, () => {
        console.log(`Worker ${process.pid} listening on port ${TCP_PORT}`)
    });
}