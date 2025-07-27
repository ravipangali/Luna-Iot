const cluster = require('cluster');
const os = require('os');
const net = require('net');
const Gt06 = require('gt06x22');

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