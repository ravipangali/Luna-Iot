const { successResponse, errorResponse } = require('../utils/response_handler');
const prisma = require('../../database/prisma');
const tcpService = require('../../tcp/tcp_service');

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

            // Check if device is connected via TCP
            const isConnected = tcpService.isDeviceConnected(imei);
            if (!isConnected) {
                return errorResponse(res, 'Vehicle not connected. Please try again when vehicle is online.', 400);
            }

            // Send command to device
            console.log(`Sending relay ON command: HFYD# to IMEI: ${imei}`);
            const commandResult = await tcpService.sendCommand(imei, 'HFYD#');
            
            if (!commandResult.success) {
                return errorResponse(res, `Failed to send command: ${commandResult.error}`, 500);
            }
            
            // Return success - device will update status via TCP
            return successResponse(res, {
                relayStatus: 'COMMAND_SENT',
                command: 'HFYD#',
                message: 'Relay ON command sent successfully. Status will update shortly.',
                deviceConnected: true
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

            // Check if device is connected via TCP
            const isConnected = tcpService.isDeviceConnected(imei);
            if (!isConnected) {
                return errorResponse(res, 'Vehicle not connected. Please try again when vehicle is online.', 400);
            }

            // Send command to device
            console.log(`Sending relay OFF command: DYD# to IMEI: ${imei}`);
            const commandResult = await tcpService.sendCommand(imei, 'DYD#');
            
            if (!commandResult.success) {
                return errorResponse(res, `Failed to send command: ${commandResult.error}`, 500);
            }
            
            // Return success - device will update status via TCP
            return successResponse(res, {
                relayStatus: 'COMMAND_SENT',
                command: 'DYD#',
                message: 'Relay OFF command sent successfully. Status will update shortly.',
                deviceConnected: true
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

            // Check device connection status
            const isConnected = tcpService.isDeviceConnected(imei);
            
            // Get latest status from database
            const latestStatus = await prisma.getClient().status.findFirst({
                where: { imei: imei },
                orderBy: { createdAt: 'desc' }
            });

            return successResponse(res, {
                relayStatus: latestStatus?.relay ? 'ON' : 'OFF',
                lastUpdated: latestStatus?.createdAt,
                deviceConnected: isConnected,
                status: isConnected ? 'ONLINE' : 'OFFLINE'
            });

        } catch (error) {
            console.error('Get relay status error:', error);
            return errorResponse(res, 'Failed to get relay status', 500);
        }
    }

    // Update relay status from device (called by GT06 handler)
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
                        ...otherStatusData
                    }
                });
            } else {
                // Create new status if none exists
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