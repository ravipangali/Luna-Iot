const Gt06 = require('gt06x22')
const DeviceModel = require('../../database/models/DeviceModel');
const StatusModel = require('../../database/models/StatusModel');
const LocationModel = require('../../database/models/LocationModel');


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
            const battery = this.getBattery(data.voltageLevel);
            const signal = this.getSignal(data.gsmSigStrength);
            await new StatusModel().createData({
                deviceId: device.id,
                imei: data.imei.toString(),
                battery: battery,
                signal: signal,
                ignition: data.terminalInfo.ignition,
                charging: data.terminalInfo.charging,
                relay: data.terminalInfo.relayState
            });
        } else if (data.event.string === 'location') {
            await new LocationModel().createData({
                deviceId: device.id,
                imei: data.imei,
                latitude: data.lat,
                longitude: data.lon,
                speed: data.speed,
                satelliteCount: data.satCnt,
                course: data.course,
            });
        } else if (data.event.string === 'login') {
            console.log(`IMEI: ${data.imei}  LOGGED IN`);
        } else if (data.event.string === 'alarm') {}
        else {
            console.log('SORRY WE DIDNT HANDLE THAT');
            console.log(data);
        }
    }

    getBattery(data) {
        data = data.toLowerCase();
        switch (data) {
            case 'no power':
                return 0;
            case 'extremely low battery':
                return 1;
            case 'very low battery':
                return 2;
            case 'low battery':
                return 3;
            case 'medium':
                return 4;
            case 'high':
                return 5;
            case 'very high':
                return 6;
            default: 
                return 0;
        }
    }

    getSignal(data) {
        data = data.toLowerCase();
        switch (data) {
            case 'no signal':
                return 0;
            case 'extremely weak signal':
                return 1;
            case 'very weak signal':
                return 2;
            case 'good signal':
                return 3;
            case 'strong signal':
                return 4;
            default: 
                return 0;
        }
    }

}

module.exports = {
    GT06Handler
}