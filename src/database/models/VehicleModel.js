const prisma = require('../prisma')
const { calculateDistanceFromLocationData } = require('../../utils/distance_service');

class VehicleModel {

    // Create new vehicle
    async createData(data) {
        try {
            const vehicle = await prisma.getClient().vehicle.create({
                data: {
                    imei: data.imei.toString(),
                    name: data.name,
                    vehicleNo: data.vehicleNo,
                    vehicleType: data.vehicleType,
                    odometer: data.odometer,
                    mileage: data.mileage,
                    minimumFuel: data.minimumFuel,
                    speedLimit: data.speedLimit,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
            });
            return vehicle;
        } catch (error) {
            console.error('VEHICLES CREATION ERROR', error);
            throw error;
        }
    }

    // Get today's location data for a specific IMEI
    async getTodayLocationData(imei) {
        imei = imei.toString();
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

            return await prisma.getClient().location.findMany({
                where: {
                    imei,
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING TODAY LOCATION DATA: ', error);
            throw error;
        }
    }

    // Get all vehicles with latest status and location data
    async getAllDataWithStatusAndLocationData() {
        try {
            const vehicles = await prisma.getClient().vehicle.findMany();
            
            // Add latest status and location to each vehicle
            const vehiclesWithData = await Promise.all(
                vehicles.map(async (vehicle) => {
                    const [latestStatus, latestLocation, todayLocationData] = await Promise.all([
                        prisma.getClient().status.findFirst({
                            where: { imei: vehicle.imei },
                            orderBy: { createdAt: 'desc' }
                        }),
                        prisma.getClient().location.findFirst({
                            where: { imei: vehicle.imei },
                            orderBy: { createdAt: 'desc' }
                        }),
                        this.getTodayLocationData(vehicle.imei)
                    ]);

                    // Calculate today's kilometers
                    const todayKm = calculateDistanceFromLocationData(todayLocationData);

                    return {
                        ...vehicle,
                        latestStatus,
                        latestLocation,
                        todayKm
                    };
                })
            );

            return vehiclesWithData;
        } catch (error) {
            console.error('ERROR FETCHING ALL VEHICLES WITH DATA: ',error);
            throw error;
        }
    }

    // Get all vehicles
    async getAllData() {
        try {
            return await prisma.getClient().vehicle.findMany();
        } catch (error) {
            console.error('ERROR FETCHING ALL VEHICLESS: ',error);
            throw error;
        }
    }
    
    // Get vehicle by imei
    async getDataByImei(imei) {
        imei = imei.toString();
        try {
            const vehicle = await prisma.getClient().vehicle.findUnique({where: {imei}});
            return vehicle;
        } catch (error) {
            console.error('VEHICLES FETCH ERROR', error);
            throw error;
        }
    }

    // Get vehicle by imei with latest status and location data
    async getDataByImeiWithStatusAndLocationData(imei) {
        imei = imei.toString();
        try {
            const vehicle = await prisma.getClient().vehicle.findUnique({where: {imei}});
            
            if (!vehicle) {
                return null;
            }

            // Get latest status, location, and today's location data
            const [latestStatus, latestLocation, todayLocationData] = await Promise.all([
                prisma.getClient().status.findFirst({
                    where: { imei },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.getClient().location.findFirst({
                    where: { imei },
                    orderBy: { createdAt: 'desc' }
                }),
                this.getTodayLocationData(imei)
            ]);

            // Calculate today's kilometers
            const todayKm = calculateDistanceFromLocationData(todayLocationData);

            return {
                ...vehicle,
                latestStatus,
                latestLocation,
                todayKm
            };
        } catch (error) {
            console.error('VEHICLES FETCH ERROR WITH DATA: ',error);
            throw error;
        }
    }
    

    // Update vehicle
    async updateData(imei, data) {
        imei = imei.toString();
        try {
            const allowedFields = ['imei', 'name', 'vehicleNo', 'vehicleType', 'odometer', 'mileage', 'minimumFuel', 'speedLimit'];
            const updateData = {};

            for (const [key, value] of Object.entries(data)) {
                if (allowedFields.includes(key)) {
                    updateData[key] = value;
                }
            }

            if (Object.keys(updateData).length === 0) {
                return null
            }

            return await prisma.getClient().vehicle.update({
                where: {imei},
                data: updateData, 
            });
        } catch (error) {
            console.error('ERROR UPDATE VEHICLES: ',error);
            throw error;
        }
    }

    // Delete vehicle
    async deleteData(imei) {
        imei = imei.toString();
        try {
            const result = await prisma.getClient().vehicle.delete({where: {imei}});
            return result;
        } catch (error) {
            console.error('ERROR DELETE VEHICLE: ',error);
            throw error;
        }
    }
}

module.exports = VehicleModel