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
            // Use 'allAccess' or 'edit' permission
            const vehicle = await prisma.getClient().vehicle.findFirst({
                where: {
                    imei: imei.toString(),
                    userVehicles: {
                        some: {
                            userId: user.id,
                            OR: [
                                { allAccess: true },
                                { edit: true }
                            ]
                        }
                    }
                }
            });

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // Send relay ON command to device
            const command = "HFYD#";
            const result = await RelayController.sendRelayCommand(imei, command);

            if (result.success) {
                // Update relay status in database
                await RelayController.updateRelayStatus(imei, true);
                
                return successResponse(res, { 
                    imei: imei,
                    relayStatus: 'ON',
                    command: command
                }, 'Relay turned ON successfully');
            } else {
                return errorResponse(res, 'Failed to turn relay ON', 500);
            }
        } catch (error) {
            console.error('Error in turnRelayOn:', error);
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
            // Use 'allAccess' or 'edit' permission
            const vehicle = await prisma.getClient().vehicle.findFirst({
                where: {
                    imei: imei.toString(),
                    userVehicles: {
                        some: {
                            userId: user.id,
                            OR: [
                                { allAccess: true },
                                { edit: true }
                            ]
                        }
                    }
                }
            });

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // Send relay OFF command to device
            const command = "DYD#";
            const result = await RelayController.sendRelayCommand(imei, command);

            if (result.success) {
                // Update relay status in database
                await RelayController.updateRelayStatus(imei, false);
                
                return successResponse(res, { 
                    imei: imei,
                    relayStatus: 'OFF',
                    command: command
                }, 'Relay turned OFF successfully');
            } else {
                return errorResponse(res, 'Failed to turn relay OFF', 500);
            }
        } catch (error) {
            console.error('Error in turnRelayOff:', error);
            return errorResponse(res, 'Failed to turn relay OFF', 500);
        }
    }

    // Get relay status
    static async getRelayStatus(req, res) {
        try {
            const { imei } = req.params;
            const user = req.user;

            // Check if user has access to this vehicle
            // Use 'allAccess' or 'edit' permission
            const vehicle = await prisma.getClient().vehicle.findFirst({
                where: {
                    imei: imei.toString(),
                    userVehicles: {
                        some: {
                            userId: user.id,
                            OR: [
                                { allAccess: true },
                                { edit: true }
                            ]
                        }
                    }
                }
            });

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // Get latest relay status from status table
            const latestStatus = await prisma.getClient().status.findFirst({
                where: { imei: imei.toString() },
                orderBy: { createdAt: 'desc' },
                select: { relay: true, createdAt: true }
            });

            return successResponse(res, {
                imei: imei,
                relayStatus: latestStatus?.relay ? 'ON' : 'OFF',
                lastUpdated: latestStatus?.createdAt
            }, 'Relay status retrieved successfully');
        } catch (error) {
            console.error('Error in getRelayStatus:', error);
            return errorResponse(res, 'Failed to get relay status', 500);
        }
    }

    // Send relay command to device via TCP
    static async sendRelayCommand(imei, command) {
        try {
            // Get TCP connection for this device
            const tcpService = require('../../tcp/tcp_service');
            const result = await tcpService.sendCommand(imei, command);
            return result;
        } catch (error) {
            console.error('Error sending relay command:', error);
            return { success: false, error: error.message };
        }
    }

    // Update relay status in database
    static async updateRelayStatus(imei, relayStatus) {
        try {
            await prisma.getClient().status.create({
                data: {
                    imei: imei.toString(),
                    relay: relayStatus,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            console.error('Error updating relay status:', error);
        }
    }
}

module.exports = RelayController;