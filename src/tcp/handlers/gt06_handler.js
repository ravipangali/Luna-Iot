const Gt06 = require('gt06x22')
const DeviceModel = require('../../database/models/DeviceModel')


class GT06Handler {

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

        gt06.msgBuffer.forEach(msg => {
            if (msg.event && msg.event.string === 'login' && msg.imei) {
                socket.deviceImei = msg.imei;
            } else {
                msg.imei = socket.deviceImei || 'Unknown';
            }

            var device = DeviceModel().getDataByImei(msg.imei);
            console.log('DEVICE FROM DB: ',device)
            console.log('DATA: ',msg)
            
            
        });

        gt06.clearMsgBuffer();
    }

    handleData(data) {
        if (msg.event.string === 'status') {
            
        }
        if (msg.event.string === 'location') {}
        else {
            console.log('SORRY WE DIDNT HANDLE THAT');
        }
    }

}

module.exports = {
    GT06Handler
}