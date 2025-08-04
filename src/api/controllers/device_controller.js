const DeviceModel = require('../../database/models/DeviceModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class DeviceController {
    // Get all devices
    static async getAllDevices(req, res) {
        try {
            const user = req.user;
            const deviceModel = new DeviceModel();
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin sees all devices
                const devices = await deviceModel.getAllData();
                return successResponse(res, devices, 'Devices retrieved successfully');
            } else {
                // Regular users see only their assigned devices
                const devices = await deviceModel.getDevicesByUserId(user.id);
                return successResponse(res, devices, 'User devices retrieved successfully');
            }
        }
        catch (error) {
            console.error('Error in get all device: ', error);
            return errorResponse(res, 'Failed to retrieve devices', 500);
        }
    }


    // Get device by IMEI
    static async getDeviceByImei(req, res) {
        try {
            const { imei } = req.params;
            const user = req.user;
            const deviceModel = new DeviceModel();
            
            let device;
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin can access any device
                device = await deviceModel.getDataByImei(imei);
            } else {
                // Regular users can only access their assigned devices
                device = await deviceModel.getDeviceByImeiForUser(imei, user.id);
            }
            
            if (!device) {
                return errorResponse(res, 'Device not found or access denied', 404);
            }
            
            return successResponse(res, device, 'Device retrieved successfully');
        } catch (error) {
            console.error('Error in getDeviceByImei:', error);
            return errorResponse(res, 'Failed to retrieve device', 500);
        }
    }

    // Create new device
    static async createDevice(req, res) {
        try {const user = req.user;
            
            // Only Super Admin can create devices
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can create devices', 403);
            }
            
            const deviceData = req.body;
            const deviceModel = new DeviceModel();
            const device = await deviceModel.createData(deviceData);
            
            return successResponse(res, device, 'Device created successfully', 201);
        } catch (error) {
            console.error('Error in createDevice:', error);
            return errorResponse(res, 'Failed to create device', 500);
        }
    }

    // Update device
    static async updateDevice(req, res) {
        try {
            const { imei } = req.params;
            const user = req.user;
            const updateData = req.body;
            const deviceModel = new DeviceModel();
            
            let device;
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin can update any device
                device = await deviceModel.updateData(imei, updateData);
            } else {
                // Regular users can only update their assigned devices
                const userDevice = await deviceModel.getDeviceByImeiForUser(imei, user.id);
                if (!userDevice) {
                    return errorResponse(res, 'Device not found or access denied', 404);
                }
                device = await deviceModel.updateData(imei, updateData);
            }
            
            if (!device) {
                return errorResponse(res, 'Device not found', 404);
            }
            
            return successResponse(res, device, 'Device updated successfully');
        } catch (error) {
            console.error('Error in updateDevice:', error);
            return errorResponse(res, 'Failed to update device', 500);
        }
    }

    // Delete device
    static async deleteDevice(req, res) {
        try {
            const user = req.user;
            
            // Only Super Admin can delete devices
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can delete devices', 403);
            }
            
            const { imei } = req.params;
            const deviceModel = new DeviceModel();
            const result = await deviceModel.deleteData(imei);
            
            if (!result) {
                return errorResponse(res, 'Device not found', 404);
            }
            
            return successResponse(res, null, 'Device deleted successfully');
        } catch (error) {
            console.error('Error in deleteDevice:', error);
            return errorResponse(res, 'Failed to delete device', 500);
        }
    }
}

module.exports = DeviceController;