const prisma = require('../prisma')
const { calculateDistanceFromLocationData } = require('../../utils/distance_service');

class VehicleModel {

    // Create new vehicle with user-vehicle relationship
    async createData(data, userId = null) {
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

            // Create user-vehicle relationship if userId is provided
            if (userId) {
                await this.createUserVehicleRelationship(userId, vehicle.id);
            }

            return vehicle;
        } catch (error) {
            console.error('VEHICLES CREATION ERROR', error);
            throw error;
        }
    }

    // Create user-vehicle relationship with ownership logic
    async createUserVehicleRelationship(userId, vehicleId) {
        try {
            // Check if this is the user's first vehicle
            const existingUserVehicles = await prisma.getClient().userVehicle.findMany({
                where: {
                    userId: userId
                }
            });

            const isMain = existingUserVehicles.length === 0; // First vehicle becomes main

            await prisma.getClient().userVehicle.create({
                data: {
                    userId: userId,
                    vehicleId: vehicleId,
                    isMain: isMain,
                    allAccess: true,
                    liveTracking: true,
                    history: true,
                    report: true,
                    vehicleProfile: true,
                    events: true,
                    geofence: true,
                    edit: true,
                    shareTracking: true,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            console.error('USER VEHICLE RELATIONSHIP CREATION ERROR', error);
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

    // Get all vehicles with role-based access, ownership, today's km, latest status and location
    async getAllVehiclesWithCompleteData(userId, userRole) {
        try {
            let vehicles;
            
            // Super Admin: all vehicles
            if (userRole === 'Super Admin') {
                vehicles = await prisma.getClient().vehicle.findMany();
            } 
            // Dealer: vehicles from assigned devices + directly assigned vehicles
            else if (userRole === 'Dealer') {
                // Get vehicles that are directly assigned to the dealer
                const directVehicles = await prisma.getClient().vehicle.findMany({
                    where: {
                        userVehicles: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                });

                // Get devices assigned to the dealer
                const dealerDevices = await prisma.getClient().device.findMany({
                    where: {
                        userDevices: {
                            some: {
                                userId: userId
                            }
                        }
                    },
                    select: {
                        imei: true
                    }
                });

                // Get vehicles that belong to dealer's devices
                const deviceVehicles = await prisma.getClient().vehicle.findMany({
                    where: {
                        imei: {
                            in: dealerDevices.map(device => device.imei)
                        }
                    }
                });

                // Combine and remove duplicates
                const allVehicles = [...directVehicles, ...deviceVehicles];
                vehicles = allVehicles.filter((vehicle, index, self) =>
                    index === self.findIndex(v => v.imei === vehicle.imei)
                );
            } 
            // Customer: only directly assigned vehicles
            else {
                vehicles = await prisma.getClient().vehicle.findMany({
                    where: {
                        userVehicles: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                });
            }

            // Add complete data to each vehicle
            const vehiclesWithData = await Promise.all(
                vehicles.map(async (vehicle) => {
                    const [latestStatus, latestLocation, todayLocationData, userVehicle] = await Promise.all([
                        prisma.getClient().status.findFirst({
                            where: { imei: vehicle.imei },
                            orderBy: { createdAt: 'desc' }
                        }),
                        prisma.getClient().location.findFirst({
                            where: { imei: vehicle.imei },
                            orderBy: { createdAt: 'desc' }
                        }),
                        this.getTodayLocationData(vehicle.imei),
                        prisma.getClient().userVehicle.findFirst({
                            where: {
                                vehicleId: vehicle.id,
                                userId: userId
                            }
                        })
                    ]);

                    // Calculate today's kilometers
                    const todayKm = calculateDistanceFromLocationData(todayLocationData);

                    // Determine ownership type
                    let ownershipType = 'Customer';
                    if (userVehicle) {
                        ownershipType = userVehicle.isMain ? 'Own' : 'Shared';
                    }

                    return {
                        ...vehicle,
                        latestStatus,
                        latestLocation,
                        todayKm,
                        ownershipType,
                        userVehicle: userVehicle || null
                    };
                })
            );

            return vehiclesWithData;
        } catch (error) {
            console.error('ERROR FETCHING ALL VEHICLES WITH COMPLETE DATA: ', error);
            throw error;
        }
    }

    // Get vehicle by IMEI with complete data and role-based access
    async getVehicleByImeiWithCompleteData(imei, userId, userRole) {
        imei = imei.toString();
        try {
            let vehicle;
            
            // Super Admin: can access any vehicle
            if (userRole === 'Super Admin') {
                vehicle = await prisma.getClient().vehicle.findUnique({ where: { imei } });
            } 
            // Dealer: can access vehicles from assigned devices or directly assigned
            else if (userRole === 'Dealer') {
                // Check if vehicle is directly assigned to dealer
                const directVehicle = await prisma.getClient().vehicle.findFirst({
                    where: {
                        imei: imei,
                        userVehicles: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                });

                if (directVehicle) {
                    vehicle = directVehicle;
                } else {
                    // Check if vehicle belongs to a device assigned to dealer
                    vehicle = await prisma.getClient().vehicle.findFirst({
                        where: {
                            imei: imei,
                            device: {
                                userDevices: {
                                    some: {
                                        userId: userId
                                    }
                                }
                            }
                        }
                    });
                }
            } 
            // Customer: can only access directly assigned vehicles
            else {
                vehicle = await prisma.getClient().vehicle.findFirst({
                    where: {
                        imei: imei,
                        userVehicles: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                });
            }

            if (!vehicle) {
                return null;
            }

            // Get complete data for the vehicle
            const [latestStatus, latestLocation, todayLocationData, userVehicle] = await Promise.all([
                prisma.getClient().status.findFirst({
                    where: { imei },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.getClient().location.findFirst({
                    where: { imei },
                    orderBy: { createdAt: 'desc' }
                }),
                this.getTodayLocationData(imei),
                prisma.getClient().userVehicle.findFirst({
                    where: {
                        vehicleId: vehicle.id,
                        userId: userId
                    }
                })
            ]);

            // Calculate today's kilometers
            const todayKm = calculateDistanceFromLocationData(todayLocationData);

            // Determine ownership type
            let ownershipType = 'Customer';
            if (userVehicle) {
                ownershipType = userVehicle.isMain ? 'Own' : 'Shared';
            }

            return {
                ...vehicle,
                latestStatus,
                latestLocation,
                todayKm,
                ownershipType,
                userVehicle: userVehicle || null
            };
        } catch (error) {
            console.error('VEHICLE FETCH ERROR WITH COMPLETE DATA: ', error);
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
                where: { imei },
                data: updateData,
            });
        } catch (error) {
            console.error('ERROR UPDATE VEHICLES: ', error);
            throw error;
        }
    }

    // Delete vehicle
    async deleteData(imei) {
        imei = imei.toString();
        try {
            const result = await prisma.getClient().vehicle.delete({ where: { imei } });
            return result;
        } catch (error) {
            console.error('ERROR DELETE VEHICLE: ', error);
            throw error;
        }
    }
}

module.exports = VehicleModel