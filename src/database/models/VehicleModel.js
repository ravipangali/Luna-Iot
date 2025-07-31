const prisma = require('../prisma')

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

    // Get all vehicles
    async getAllData() {
        try {
            return await prisma.getClient().vehicle.findMany();
        } catch (error) {
            console.error('ERROR FETCHING ALL VEHICLESS: ',error);
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
                    const [latestStatus, latestLocation] = await Promise.all([
                        prisma.getClient().status.findFirst({
                            where: { imei: vehicle.imei },
                            orderBy: { createdAt: 'desc' }
                        }),
                        prisma.getClient().location.findFirst({
                            where: { imei: vehicle.imei },
                            orderBy: { createdAt: 'desc' }
                        })
                    ]);

                    return {
                        ...vehicle,
                        latestStatus,
                        latestLocation
                    };
                })
            );

            return vehiclesWithData;
        } catch (error) {
            console.error('ERROR FETCHING ALL VEHICLES WITH DATA: ',error);
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

            // Get latest status and location
            const [latestStatus, latestLocation] = await Promise.all([
                prisma.getClient().status.findFirst({
                    where: { imei },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.getClient().location.findFirst({
                    where: { imei },
                    orderBy: { createdAt: 'desc' }
                })
            ]);

            return {
                ...vehicle,
                latestStatus,
                latestLocation
            };
        } catch (error) {
            console.error('VEHICLES FETCH ERROR WITH DATA: ',error);
            throw error;
        }
    }

    // Get vehicle by id
    async getDataById(id) {
        try {
            const vehicle = await prisma.getClient().vehicle.findUnique({where: {id}});
            return vehicle;
        } catch (error) {
            console.error('VEHICLES FETCH ERROR', error);
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