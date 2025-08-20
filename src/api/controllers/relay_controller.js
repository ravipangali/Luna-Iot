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

            // Send command to device via TCP service
            console.log(`Sending relay ON command: HFYD# to IMEI: ${imei}`);
            
            // Import TCP service to send actual command
            const tcpService = require('../../tcp/tcp_service');
            const commandResult = await tcpService.sendCommand(imei, 'HFYD#');
            
            if (!commandResult.success) {
                return errorResponse(res, `Failed to send command: ${commandResult.error}`, 500);
            }
            
            // Don't update database yet - wait for device response
            // The database will be updated when the device sends status update
            return successResponse(res, {
                relayStatus: 'PENDING',
                command: 'HFYD#',
                message: 'Relay ON command sent successfully. Status will update when device responds.',
                deviceResponse: commandResult
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

            // Send command to device via TCP service
            console.log(`Sending relay OFF command: DYD# to IMEI: ${imei}`);
            
            // Import TCP service to send actual command
            const tcpService = require('../../tcp/tcp_service');
            const commandResult = await tcpService.sendCommand(imei, 'DYD#');
            
            if (!commandResult.success) {
                return errorResponse(res, `Failed to send command: ${commandResult.error}`, 500);
            }
            
            // Don't update database yet - wait for device response
            // The database will be updated when the device sends status update
            return successResponse(res, {
                relayStatus: 'PENDING',
                command: 'DYD#',
                message: 'Relay OFF command sent successfully. Status will update when device responds.',
                deviceResponse: commandResult
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

            // Get latest status from database (this reflects actual device state)
            const latestStatus = await prisma.getClient().status.findFirst({
                where: { imei: imei },
                orderBy: { createdAt: 'desc' }
            });

            return successResponse(res, {
                relayStatus: latestStatus?.relay ? 'ON' : 'OFF',
                lastUpdated: latestStatus?.createdAt,
                isDeviceConnected: latestStatus ? true : false
            });

        } catch (error) {
            console.error('Get relay status error:', error);
            return errorResponse(res, 'Failed to get relay status', 500);
        }
    }

    // This method will be called by the GT06 handler when device sends status update
    // It updates the database with the actual relay state from the device
    static async updateRelayStatusFromDevice(imei, relayStatus, otherStatusData = {}) {
        try {
            // Get the latest status to copy existing values
            const latestStatus = await prisma.getClient().status.findFirst({
                where: { imei: imei },
                orderBy: { createdAt: 'desc' }
            });

            if (latestStatus) {
                // Update existing status with new relay state and other data
                await prisma.getClient().status.update({
                    where: { id: latestStatus.id },
                    data: { 
                        relay: relayStatus,
                        ...otherStatusData // Include any other status updates from device
                    }
                });
            } else {
                // Create new status if none exists (with default values)
                await prisma.getClient().status.create({
                    data: {
                        imei: imei,
                        battery: otherStatusData.battery || 0,
                        signal: otherStatusData.signal || 0,
                        ignition: otherStatusData.ignition || false,
                        charging: otherStatusData.charging || false,
                        relay: relayStatus,
                        createdAt: new Date()
                    }
                });
            }

            console.log(`Relay status updated from device: IMEI ${imei}, Relay: ${relayStatus ? 'ON' : 'OFF'}`);
        } catch (error) {
            console.error('Update relay status from device error:', error);
            throw error;
        }
    }
}

module.exports = RelayController;