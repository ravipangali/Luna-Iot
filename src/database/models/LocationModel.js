const prisma = require('../prisma')

class LocationModel {

    // Create new location
    async createData(data) {
        try {
            const location = await prisma.getClient().location.create({
                data: {
                    imei: data.imei.toString(),
                    latitude: data.latitude,
                    longitude: data.longitude,
                    speed: data.speed,
                    course: data.course,
                    realTimeGps: data.realTimeGps,
                    satellite: data.satellite,
                    createdAt: new Date()
                }
            });
            return location;
        } catch (error) {
            console.error('LOCATION CREATION ERROR', error);
            throw error;
        }
    }

    // Get latest location data
    async getLatest(imei) {
        imei = imei.toString();
        try {
            const location = await prisma.getClient().location.findFirst({
                where: {imei},
                orderBy: {createdAt: 'desc'}
            });
            return location;
        } catch (error) {
            console.error('ERROR FETCHING LATEST LOCATION: ',error);
            throw error;
        }
    }

    // Get location history
    async deleteOldData(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await prisma.getClient().location.deleteMany({
                where: {
                    createdAt: {lt: cutoffDate}
                }
            });
            return result.count;
        }
        catch (error) {
            console.error('ERROR ON DELETEING OLD LOCATION: ',error);
            throw error;
        }
    }

    // Get location by date range
    async getDataByDateRange(imei, startDate, endDate) {
        imei = imei.toString();
        try {
            return await prisma.getClient().location.findMany({
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
            console.error('ERROR FETCHING LOCATION BY DATE RANGE: ',error);
            throw error;
        }
    }

    // Get location by imei
    async getDataByImei(imei) {
        imei = imei.toString();
        try {
            const location = await prisma.getClient().location.findMany({where: {imei}, orderBy: {createdAt: 'asc'}});
            return location;
        } catch (error) {
            console.error('LOCATION FETCH ERROR', error);
            throw error;
        }
    }

    // Get combined history data (location + status with ignition off, only 3 fields for status)
    async getCombinedHistoryByDateRange(imei, startDate, endDate) {
        imei = imei.toString();
        try {
            // Get location data
            const locations = await prisma.getClient().location.findMany({
                where: {
                    imei,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            // Get status data with ignition off - only 3 fields
            const statuses = await prisma.getClient().status.findMany({
                where: {
                    imei,
                    ignition: false, // Only status records where ignition is off
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            // Combine and sort by createdAt
            const combinedData = [
                ...locations.map(loc => ({
                    ...loc,
                    type: 'location',
                    dataType: 'location'
                })),
                ...statuses.map(status => ({
                    ...status,
                    type: 'status',
                    dataType: 'status'
                }))
            ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            return combinedData;
        } catch (error) {
            console.error('ERROR FETCHING COMBINED HISTORY: ', error);
            throw error;
        }
    }

}

module.exports = LocationModel