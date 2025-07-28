const Gt06 = require('gt06x22')
const DeviceModel = require('../../database/models/DeviceModel');
const StatusModel = require('../../database/models/StatusModel');


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

            this.handleData(msg)

        });

        gt06.clearMsgBuffer();
    }

    async handleData(data) {
        var device = new DeviceModel();
        device = await device.getDataByImei(data.imei);
        
        if (device === null) {
            console.warn(`${new Date().toISOString()} => IMEI IS NOT REGISTERED: `,data.imei);
            return;
        }

        if (data.event.string === 'status') {
            // var status = new StatusModel();
            console.log(`IMEI: ${data.imei}  Battery: ${data.voltageLevel}  Signal: ${data.gsmSigStrength}  Ignition: ${data.terminalInfo.ignition}  Charging: ${data.terminalInfo.charging}  Relay: ${data.terminalInfo.relayState}`);
            // status = await status.createData({
            //     deviceId: device.id,
            //     imei: data.imei,
            //     battery: data.battery,
            //     signal: data.signal,
            //     ignition: data.ignition,
            //     charging: data.charging,
            //     relay: data.relay
            // });
        } else if (data.event.string === 'location') {
            console.log(`IMEI: ${data.imei}  Latitude: ${data.lat}  Longitude: ${data.lon}  Speed: ${data.speed}  SatelliteCount: ${data.satCnt}  Course: ${data.course}  RealTimeGPS: ${data.realTimeGps}`);
        } else if (data.event.string === 'login') {
            console.log(`IMEI: ${data.imei}  LOGGED IN`);
        }
        else {
            console.log('SORRY WE DIDNT HANDLE THAT');
        }
    }

}

module.exports = {
    GT06Handler
}