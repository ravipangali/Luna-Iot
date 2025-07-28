const DeviceModel = require('../../database/models/DeviceModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class DeviceController {
    // Get all devices
    static async getAllDevices(req, res) {
        try {
            const deviceModel = new DeviceModel();
            const devices = await deviceModel.getAllData();
            return successResponse(res, devices, 'Devices retrieved successfully');
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
            const deviceModel = new DeviceModel();
            const device = await deviceModel.getDataByImei(imei);
            
            if (!device) {
                return errorResponse(res, 'Device not found', 404);
            }
            
            return successResponse(res, device, 'Device retrieved successfully');
        } catch (error) {
            console.error('Error in getDeviceByImei:', error);
            return errorResponse(res, 'Failed to retrieve device', 500);
        }
    }

    // Create new device
    static async createDevice(req, res) {
        try {
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
            const updateData = req.body;
            const deviceModel = new DeviceModel();
            const device = await deviceModel.updateData(imei, updateData);
            
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