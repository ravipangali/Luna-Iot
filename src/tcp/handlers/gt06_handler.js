const Gt06 = require('gt06x22')
const DeviceModel = require('../../database/models/DeviceModel');
const StatusModel = require('../../database/models/StatusModel');
const LocationModel = require('../../database/models/LocationModel');
const socketService = require('../../socket/socket_service');

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

            this.handleData(msg, socket);

        });

        gt06.clearMsgBuffer();
    }

    async handleData(data, socket) {
        var device = new DeviceModel();
        device = await device.getDataByImei(data.imei);

        if (device === null) {
            socketService._deviceMonitoringMessage('imei_not_registered', data.imei, null, null);
            return;
        }

        if (data.event.string === 'status') {
            const battery = this.getBattery(data.voltageLevel);
            const signal = this.getSignal(data.gsmSigStrength);
            const statusData = {
                imei: data.imei.toString(),
                battery: battery,
                signal: signal,
                ignition: data.terminalInfo.ignition,
                charging: data.terminalInfo.charging,
                relay: data.terminalInfo.relayState
            };
            await new StatusModel().createData(statusData);
            socketService._deviceMonitoringMessage('status', data.imei, null, null);
            data = `${new Date().toISOString()} => STATUS: ${data.imei} => WRITE SUCCESSFULL`;
            console.log(data);
        } else if (data.event.string === 'location') {
            const locationData = {
                imei: data.imei,
                latitude: data.lat,
                longitude: data.lon,
                speed: data.speed,
                satellite: data.satCnt,
                course: data.course,
                realTimeGps: data.realTimeGps,
            };
            await new LocationModel().createData(locationData);
            socketService._deviceMonitoringMessage('location', data.imei, data.lat, data.lon);
        } else if (data.event.string === 'login') {
            socketService._deviceMonitoringMessage('login', data.imei, null, null);
        } else if (data.event.string === 'alarm') {
        }
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