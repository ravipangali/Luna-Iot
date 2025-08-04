const prisma = require('../prisma')
const { calculateDistanceFromLocationData } = require('../../utils/distance_service');

class VehicleModel {

    // Create new vehicle
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

    // Add this new method after createData
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
            console.error('ERROR FETCHING ALL VEHICLES WITH DATA: ', error);
            throw error;
        }
    }

    // Get vehicles by user ID with latest status and location data
    async getVehiclesByUserIdWithStatusAndLocationData(userId) {
        try {
            const vehicles = await prisma.getClient().vehicle.findMany({
                where: {
                    userVehicles: {
                        some: {
                            userId: userId
                        }
                    }
                }
            });

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
            console.error('ERROR FETCHING USER VEHICLES WITH DATA: ', error);
            throw error;
        }
    }


    // Get vehicles by user ID with ownership type
    async getVehiclesByUserIdWithOwnershipType(userId) {
        try {
            const vehicles = await prisma.getClient().vehicle.findMany({
                where: {
                    userVehicles: {
                        some: {
                            userId: userId
                        }
                    }
                },
                include: {
                    userVehicles: {
                        where: {
                            userId: userId
                        },
                        select: {
                            isMain: true,
                            allAccess: true,
                            liveTracking: true,
                            history: true,
                            report: true,
                            vehicleProfile: true,
                            events: true,
                            geofence: true,
                            edit: true,
                            shareTracking: true
                        }
                    }
                }
            });

            // Add ownership type to each vehicle
            const vehiclesWithOwnership = vehicles.map(vehicle => {
                const userVehicle = vehicle.userVehicles[0];
                let ownershipType = 'Shared';

                if (userVehicle.isMain) {
                    ownershipType = 'Own';
                } else if (userVehicle.allAccess && userVehicle.edit) {
                    ownershipType = 'Customer';
                }
                // Otherwise it remains 'Shared'

                return {
                    ...vehicle,
                    ownershipType,
                    userVehicle: userVehicle
                };
            });

            return vehiclesWithOwnership;
        } catch (error) {
            console.error('ERROR FETCHING VEHICLES WITH OWNERSHIP TYPE: ', error);
            throw error;
        }
    }


    // Get vehicles for Dealer role (direct assignments + vehicles from dealer's devices)
    async getVehiclesForDealer(dealerId) {
        try {
            // Get vehicles that are directly assigned to the dealer
            const directVehicles = await prisma.getClient().vehicle.findMany({
                where: {
                    userVehicles: {
                        some: {
                            userId: dealerId
                        }
                    }
                },
                include: {
                    device: true
                }
            });

            // Get devices assigned to the dealer
            const dealerDevices = await prisma.getClient().device.findMany({
                where: {
                    userDevices: {
                        some: {
                            userId: dealerId
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
                },
                include: {
                    device: true
                }
            });

            // Combine and remove duplicates
            const allVehicles = [...directVehicles, ...deviceVehicles];
            const uniqueVehicles = allVehicles.filter((vehicle, index, self) =>
                index === self.findIndex(v => v.imei === vehicle.imei)
            );

            return uniqueVehicles;
        } catch (error) {
            console.error('ERROR FETCHING DEALER VEHICLES: ', error);
            throw error;
        }
    }

    // Get vehicles for Dealer role with status and location data
    async getVehiclesForDealerWithStatusAndLocationData(dealerId) {
        try {
            // Get vehicles for dealer
            const vehicles = await this.getVehiclesForDealer(dealerId);

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
            console.error('ERROR FETCHING DEALER VEHICLES WITH DATA: ', error);
            throw error;
        }
    }

    // Get vehicle by IMEI for Dealer (check if vehicle belongs to dealer's devices or direct assignment)
    async getVehicleByImeiForDealer(imei, dealerId) {
        imei = imei.toString();
        try {
            // Check if vehicle is directly assigned to dealer
            const directVehicle = await prisma.getClient().vehicle.findFirst({
                where: {
                    imei: imei,
                    userVehicles: {
                        some: {
                            userId: dealerId
                        }
                    }
                },
                include: {
                    device: true
                }
            });

            if (directVehicle) {
                return directVehicle;
            }

            // Check if vehicle belongs to a device assigned to dealer
            const deviceVehicle = await prisma.getClient().vehicle.findFirst({
                where: {
                    imei: imei,
                    device: {
                        userDevices: {
                            some: {
                                userId: dealerId
                            }
                        }
                    }
                },
                include: {
                    device: true
                }
            });

            return deviceVehicle;
        } catch (error) {
            console.error('VEHICLE FETCH ERROR FOR DEALER: ', error);
            throw error;
        }
    }

    // Get vehicle by IMEI with status and location data for Dealer
    async getVehicleByImeiWithStatusAndLocationDataForDealer(imei, dealerId) {
        imei = imei.toString();
        try {
            const vehicle = await this.getVehicleByImeiForDealer(imei, dealerId);

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
            console.error('VEHICLES FETCH ERROR WITH DATA FOR DEALER: ', error);
            throw error;
        }
    }

    // Get all vehicles
    async getAllData() {
        try {
            return await prisma.getClient().vehicle.findMany();
        } catch (error) {
            console.error('ERROR FETCHING ALL VEHICLESS: ', error);
            throw error;
        }
    }

    // Get vehicles by user ID (for non-admin users)
    async getVehiclesByUserId(userId) {
        try {
            const vehicles = await prisma.getClient().vehicle.findMany({
                where: {
                    userVehicles: {
                        some: {
                            userId: userId
                        }
                    }
                },
                include: {
                    device: true
                }
            });
            return vehicles;
        } catch (error) {
            console.error('ERROR FETCHING USER VEHICLES: ', error);
            throw error;
        }
    }

    // Get vehicle by imei
    async getDataByImei(imei) {
        imei = imei.toString();
        try {
            const vehicle = await prisma.getClient().vehicle.findUnique({ where: { imei } });
            return vehicle;
        } catch (error) {
            console.error('VEHICLES FETCH ERROR', error);
            throw error;
        }
    }

    // Get vehicle by imei for specific user (check access)
    async getVehicleByImeiForUser(imei, userId) {
        imei = imei.toString();
        try {
            const vehicle = await prisma.getClient().vehicle.findFirst({
                where: {
                    imei: imei,
                    userVehicles: {
                        some: {
                            userId: userId
                        }
                    }
                },
                include: {
                    device: true
                }
            });
            return vehicle;
        } catch (error) {
            console.error('VEHICLE FETCH ERROR FOR USER: ', error);
            throw error;
        }
    }


    // Get vehicle by imei with latest status and location data
    async getDataByImeiWithStatusAndLocationData(imei) {
        imei = imei.toString();
        try {
            const vehicle = await prisma.getClient().vehicle.findUnique({ where: { imei } });

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
            console.error('VEHICLES FETCH ERROR WITH DATA: ', error);
            throw error;
        }
    }

    // Get vehicle by imei with latest status and location data for specific user
    async getVehicleByImeiWithStatusAndLocationDataForUser(imei, userId) {
        imei = imei.toString();
        try {
            const vehicle = await prisma.getClient().vehicle.findFirst({
                where: {
                    imei: imei,
                    userVehicles: {
                        some: {
                            userId: userId
                        }
                    }
                }
            });

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
            console.error('VEHICLES FETCH ERROR WITH DATA FOR USER: ', error);
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