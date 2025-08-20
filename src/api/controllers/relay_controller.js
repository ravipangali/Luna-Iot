const { successResponse, errorResponse } = require('../utils/response_handler');
const prisma = require('../../database/prisma');

class RelayController {
    // Turn relay ON
    static async turnRelayOn(req, res) {
        try {
            const { imei } = req.body;
            const user = req.user;

            if (!imei) {
                return errorResponse(res, 'IMEI is required', 400);
            }

            // Check if user has access to this vehicle
            const userVehicle = await prisma.getClient().userVehicle.findFirst({
                where: {
                    userId: user.id,
                    vehicle: {
                        imei: imei
                    }
                },
                include: {
                    vehicle: true
                }
            });

            if (!userVehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // For now, just simulate the command and update status
            // You can integrate with your existing TCP service later
            console.log(`Sending relay ON command: HFYD# to IMEI: ${imei}`);
            
            // Update relay status in database
            await RelayController.updateRelayStatus(imei, true);
            
            return successResponse(res, {
                relayStatus: 'ON',
                command: 'HFYD#',
                message: 'Relay turned ON successfully'
            });

        } catch (error) {
            console.error('Relay ON error:', error);
            return errorResponse(res, 'Failed to turn relay ON', 500);
        }
    }

    // Turn relay OFF
    static async turnRelayOff(req, res) {
        try {
            const { imei } = req.body;
            const user = req.user;

            if (!imei) {
                return errorResponse(res, 'IMEI is required', 400);
            }

            // Check if user has access to this vehicle
            const userVehicle = await prisma.getClient().userVehicle.findFirst({
                where: {
                    userId: user.id,
                    vehicle: {
                        imei: imei
                    }
                },
                include: {
                    vehicle: true
                }
            });

            if (!userVehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // For now, just simulate the command and update status
            // You can integrate with your existing TCP service later
            console.log(`Sending relay OFF command: DYD# to IMEI: ${imei}`);
            
            // Update relay status in database
            await RelayController.updateRelayStatus(imei, false);
            
            return successResponse(res, {
                relayStatus: 'OFF',
                command: 'DYD#',
                message: 'Relay turned OFF successfully'
            });

        } catch (error) {
            console.error('Relay OFF error:', error);
            return errorResponse(res, 'Failed to turn relay OFF', 500);
        }
    }

    // Get relay status
    static async getRelayStatus(req, res) {
        try {
            const { imei } = req.params;
            const user = req.user;

            if (!imei) {
                return errorResponse(res, 'IMEI is required', 400);
            }

            // Check if user has access to this vehicle
            const userVehicle = await prisma.getClient().userVehicle.findFirst({
                where: {
                    userId: user.id,
                    vehicle: {
                        imei: imei
                    }
                },
                include: {
                    vehicle: true
                }
            });

            if (!userVehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // Get latest status
            const latestStatus = await prisma.getClient().status.findFirst({
                where: { imei: imei },
                orderBy: { createdAt: 'desc' }
            });

            return successResponse(res, {
                relayStatus: latestStatus?.relay ? 'ON' : 'OFF',
                lastUpdated: latestStatus?.createdAt
            });

        } catch (error) {
            console.error('Get relay status error:', error);
            return errorResponse(res, 'Failed to get relay status', 500);
        }
    }

    // Update relay status in database
    static async updateRelayStatus(imei, relayStatus) {
        try {
            await prisma.getClient().status.create({
                data: {
                    imei: imei,
                    relay: relayStatus,
                    battery: 0, // Default value
                    signal: 0,   // Default value
                    ignition: false, // Default value
                    charging: false, // Default value
                    createdAt: new Date()
                }
            });
        } catch (error) {
            console.error('Update relay status error:', error);
        }
    }
}

module.exports = RelayController;