const prisma = require('../prisma')

class StatusModel {

    // Create new status
    async createData(data) {
        try {
            const status = await prisma.getClient().status.create({
                data: {
                    deviceId: data.deviceId,
                    imei: data.imei,
                    battery: data.battery,
                    signal: data.signal,
                    ignition: data.ignition,
                    charging: data.charging,
                    relay: data.relay,
                }
            });
            return status;
        } catch (error) {
            console.error('STATUS CREATION ERROR', error);
            throw error;
        }
    }

    // Get latest status data
    async getLatest(imei) {
        try {
            const status = await prisma.getClient().status.findFirst({
                where: {imei},
                orderBy: {createdAt: 'desc'}
            });
            return status;
        } catch (error) {
            console.error('ERROR FETCHING LATEST STATUS: ',error);
            throw error;
        }
    }

    // Get status history
    async deleteOldData(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await prisma.getClient().status.deleteMany({
                where: {
                    createdAt: {lt: cutoffDate}
                }
            });
            return result.count;
        }
        catch (error) {
            console.error('ERROR ON DELETEING OLD STATUS: ',error);
            throw error;
        }
    }

    // Get location by date range
    async getDataByDateRange(imei, startDate, endDate) {
        try {
            return await prisma.getClient().status.findMany({
                where: {
                    imei,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING STATUS BY DATE RANGE: ',error);
            throw error;
        }
    }

    // Get status by imei
    async getDataByImei(imei) {
        try {
            const status = await prisma.getClient().status.findMany({where: {imei}, orderBy: {createdAt: 'asc'}});
            return status;
        } catch (error) {
            console.error('STATUS FETCH ERROR', error);
            throw error;
        }
    }

}

module.exports = StatusModel