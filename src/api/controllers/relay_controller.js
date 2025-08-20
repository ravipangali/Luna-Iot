const { successResponse, errorResponse } = require('../utils/response_handler');
const prisma = require('../../database/prisma');
const tcpService = require('../../tcp/tcp_service');

class RelayController {
    // Turn relay ON with auto-reconnection
    static async turnRelayOn(req, res) {
        try {
            const { imei } = req.body;
            const user = req.user;

            if (!imei) {
                return errorResponse(res, 'IMEI is required', 400);
            }

            // Check if user has access to this vehicle
            const userVehicle = await prisma.vehicle.findFirst({
                where: {
                    device: {
                        imei: imei
                    },
                    OR: [
                        { userId: user.id },
                        { dealerId: user.id },
                        { adminId: user.id }
                    ]
                }
            });

            if (!userVehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // Check device connection status
            let isConnected = tcpService.isDeviceConnected(imei);

            // If device is not connected, attempt reconnection
            if (!isConnected) {
                console.log(`Device ${imei} is offline, attempting reconnection...`);
                
                // Attempt reconnection
                const reconnected = await tcpService.attemptDeviceReconnection(imei);
                
                if (reconnected) {
                    isConnected = true;
                    console.log(`Device ${imei} reconnected successfully`);
                } else {
                    console.log(`Device ${imei} reconnection failed`);
                    return errorResponse(res, 'Vehicle not connected. Please try again later.', 503);
                }
            }

            // Device is now connected, send relay command
            console.log(`Sending relay ON command to device: ${imei}`);
            
            // Send command to device via TCP
            const commandResult = await tcpService.sendRelayCommand(imei, 'ON');
            
            if (commandResult.success) {
                // Update relay status in database
                await RelayController.updateRelayStatus(imei, true);
                
                return successResponse(res, 'Relay turned ON successfully', {
                    imei: imei,
                    relayStatus: true,
                    timestamp: new Date()
                });
            } else {
                return errorResponse(res, `Failed to send relay command: ${commandResult.error}`, 500);
            }

        } catch (error) {
            console.error('Error in turnRelayOn:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Turn relay OFF with auto-reconnection
    static async turnRelayOff(req, res) {
        try {
            const { imei } = req.body;
            const user = req.user;

            if (!imei) {
                return errorResponse(res, 'IMEI is required', 400);
            }

            // Check if user has access to this vehicle
            const userVehicle = await prisma.vehicle.findFirst({
                where: {
                    device: {
                        imei: imei
                    },
                    OR: [
                        { userId: user.id },
                        { dealerId: user.id },
                        { adminId: user.id }
                    ]
                }
            });

            if (!userVehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // Check device connection status
            let isConnected = tcpService.isDeviceConnected(imei);

            // If device is not connected, attempt reconnection
            if (!isConnected) {
                console.log(`Device ${imei} is offline, attempting reconnection...`);
                
                // Attempt reconnection
                const reconnected = await tcpService.attemptDeviceReconnection(imei);
                
                if (reconnected) {
                    isConnected = true;
                    console.log(`Device ${imei} reconnected successfully`);
                } else {
                    console.log(`Device ${imei} reconnection failed`);
                    return errorResponse(res, 'Vehicle not connected. Please try again later.', 503);
                }
            }

            // Device is now connected, send relay command
            console.log(`Sending relay OFF command to device: ${imei}`);
            
            // Send command to device via TCP
            const commandResult = await tcpService.sendRelayCommand(imei, 'OFF');
            
            if (commandResult.success) {
                // Update relay status in database
                await RelayController.updateRelayStatus(imei, false);
                
                return successResponse(res, 'Relay turned OFF successfully', {
                    imei: imei,
                    relayStatus: false,
                    timestamp: new Date()
                });
            } else {
                return errorResponse(res, `Failed to send relay command: ${commandResult.error}`, 500);
            }

        } catch (error) {
            console.error('Error in turnRelayOff:', error);
            return errorResponse(res, 'Internal server error', 500);
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
            const userVehicle = await prisma.vehicle.findFirst({
                where: {
                    device: {
                        imei: imei
                    },
                    OR: [
                        { userId: user.id },
                        { dealerId: user.id },
                        { adminId: user.id }
                    ]
                }
            });

            if (!userVehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            // Get current relay status from database
            const status = await prisma.status.findFirst({
                where: { imei: imei },
                orderBy: { timestamp: 'desc' }
            });

            const relayStatus = status ? status.relay : false;

            return successResponse(res, 'Relay status retrieved successfully', {
                imei: imei,
                relayStatus: relayStatus,
                isConnected: tcpService.isDeviceConnected(imei),
                lastUpdated: status ? status.timestamp : null
            });

        } catch (error) {
            console.error('Error in getRelayStatus:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get device connection status
    static async getDeviceConnectionStatus(req, res) {
        try {
            const { imei } = req.params;
            const user = req.user;

            if (!imei) {
                return errorResponse(res, 'IMEI is required', 400);
            }

            // Check if user has access to this vehicle
            const userVehicle = await prisma.vehicle.findFirst({
                where: {
                    device: {
                        imei: imei
                    },
                    OR: [
                        { userId: user.id },
                        { dealerId: user.id },
                        { adminId: user.id }
                    ]
                }
            });

            if (!userVehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
            }

            const isConnected = tcpService.isDeviceConnected(imei);
            const connection = tcpService.getDeviceConnection(imei);

            return successResponse(res, 'Device connection status retrieved successfully', {
                imei: imei,
                isConnected: isConnected,
                lastSeen: connection ? connection.lastSeen : null,
                connectionInfo: connection ? {
                    connectionId: connection.connectionId,
                    lastSeen: connection.lastSeen
                } : null
            });

        } catch (error) {
            console.error('Error in getDeviceConnectionStatus:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Update relay status in database
    static async updateRelayStatus(imei, relayStatus) {
        try {
            // Find existing status record
            const existingStatus = await prisma.status.findFirst({
                where: { imei: imei },
                orderBy: { timestamp: 'desc' }
            });

            if (existingStatus) {
                // Update existing status
                await prisma.status.update({
                    where: { id: existingStatus.id },
                    data: { 
                        relay: relayStatus,
                        timestamp: new Date()
                    }
                });
            } else {
                // Create new status record with minimal required fields
                await prisma.status.create({
                    data: {
                        imei: imei,
                        relay: relayStatus,
                        battery: 0, // Default value
                        signal: 0,   // Default value
                        ignition: false, // Default value
                        charging: false, // Default value
                        timestamp: new Date()
                    }
                });
            }

            console.log(`Relay status updated for device ${imei}: ${relayStatus}`);
        } catch (error) {
            console.error(`Error updating relay status for device ${imei}:`, error);
            throw error;
        }
    }

    // Debug endpoint to check all connections
static async debugConnections(req, res) {
    try {
        const tcpService = require('../../tcp/tcp_service');
        
        // Get all connected devices
        const connectedDevices = tcpService.getConnectedDevices();
        
        // Debug connections
        tcpService.debugConnections();
        
        return successResponse(res, 'Connection debug info', {
            totalConnections: connectedDevices.length,
            connectedDevices: connectedDevices,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error in debugConnections:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
}
}

module.exports = RelayController;