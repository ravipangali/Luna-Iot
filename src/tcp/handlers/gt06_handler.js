const Gt06 = require('gt06x22')


class GT06Handler {
    static deviceIMEIs = new Map(); // Store IMEI per socket connection

    constructor(data, socket) {
        var gt06 = new Gt06();

        try {
            gt06.parse(data);
        } catch (e) {
            console.log('Error while parsing gt06 data: ', e);
            return;
        }

        if (gt06.expectsResponse) {
            socket.write(gt06.responseMsg);
        }

        // Log each message with its details
        gt06.msgBuffer.forEach(msg => {
            console.log('=== GT06 Message ===');
            console.log('Message Type:', msg.event ? msg.event.event : 'Unknown');
            console.log('Message Number:', msg.event ? msg.event.number : 'Unknown');
            console.log('IMEI:', msg.imei);
            
            // Store IMEI from login message
            if (msg.event && msg.event.number === 0x01 && msg.imei) {
                const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
                GT06Handler.deviceIMEIs.set(connectionId, msg.imei);
                console.log('Login Message - IMEI stored for connection:', connectionId);
                console.log('Login Message - Serial Number:', msg.serialNumber);
            }
            
            // Log specific data based on message type
            if (msg.event && msg.event.number === 0x01) {
                console.log('Login Message - Serial Number:', msg.serialNumber);
            } else if (msg.event && (msg.event.number === 0x12 || msg.event.number === 0x22)) {
                console.log('Location Message - Latitude:', msg.latitude);
                console.log('Location Message - Longitude:', msg.longitude);
                console.log('Location Message - Speed:', msg.speed);
                console.log('Location Message - Course:', msg.course);
            } else if (msg.event && msg.event.number === 0x13) {
                console.log('Status Message - Terminal Info:', msg.terminalInfo);
                console.log('Status Message - Voltage Level:', msg.voltageLevel);
                console.log('Status Message - GSM Signal:', msg.gsmSigStrength);
            }
            
            // If IMEI is null but we have a stored IMEI for this connection, use it
            if (!msg.imei) {
                const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
                const storedIMEI = GT06Handler.deviceIMEIs.get(connectionId);
                if (storedIMEI) {
                    console.log('Using stored IMEI for connection:', storedIMEI);
                    msg.imei = storedIMEI;
                } else {
                    console.log('Warning: No IMEI available for this message');
                }
            }
            
            console.log('Full Message Object:', JSON.stringify(msg, null, 2));
            console.log('==================');
        });

        // Store the IMEI for future use if it's a login message
        if (gt06.imei) {
            console.log('Device IMEI stored:', gt06.imei);
        }

        gt06.clearMsgBuffer();
    }

    // Static method to get IMEI for a connection
    static getIMEIForConnection(socket) {
        const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
        return GT06Handler.deviceIMEIs.get(connectionId);
    }

    // Static method to clear IMEI when connection closes
    static clearIMEIForConnection(socket) {
        const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
        GT06Handler.deviceIMEIs.delete(connectionId);
    }
}

module.exports = {
    GT06Handler
}