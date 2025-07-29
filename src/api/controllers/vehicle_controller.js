// src/api/controllers/vehicle_controller.js
const VehicleModel = require('../../database/models/VehicleModel');
const DeviceModel = require('../../database/models/DeviceModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class VehicleController {
    // Get all vehicles
    static async getAllVehicles(req, res) {
        try {
            const vehicleModel = new VehicleModel();
            const vehicles = await vehicleModel.getAllData();

            return successResponse(res, vehicles, 'Vehicles retrieved successfully');
        } catch (error) {
            console.error('Error in getAllVehicles:', error);
            return errorResponse(res, 'Failed to retrieve vehicles', 500);
        }
    }


    // Get vehicle by IMEI
    static async getVehicleByImei(req, res) {
        try {
            const { imei } = req.params;
            const vehicleModel = new VehicleModel();
            const vehicle = await vehicleModel.getDataByImei(imei);

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found', 404);
            }

            return successResponse(res, vehicle, 'Vehicle retrieved successfully');
        } catch (error) {
            console.error('Error in getVehicleByImei:', error);
            return errorResponse(res, 'Failed to retrieve vehicle', 500);
        }
    }

    // Create new vehicle
    static async createVehicle(req, res) {
        try {
            const vehicleData = req.body;

            // Check if device IMEI exists
            const deviceModel = new DeviceModel();
            const device = await deviceModel.getDataByImei(vehicleData.imei);

            if (!device) {
                return errorResponse(res, 'Device with this IMEI does not exist', 400);
            }

            const vehicleModel = new VehicleModel();
            const imeiExists = await vehicleModel.getDataByImei(vehicleData.imei);

            if (imeiExists) {
                return errorResponse(res, 'Vehicle with this IMEI already exists', 400);
            }

            const vehicle = await vehicleModel.createData(vehicleData);
            return successResponse(res, vehicle, 'Vehicle created successfully', 201);
        } catch (error) {
            console.error('Error in createVehicle:', error);
            return errorResponse(res, 'Failed to create vehicle', 500);
        }
    }

    // Update vehicle
    static async updateVehicle(req, res) {
        try {
            const { imei } = req.params;
            const updateData = req.body;

            // If imei is being updated, cehck if the new imei exist in device
            if (updateData.imei && updateData.imei !== imei) {
                const deviceModel = new DeviceModel();
                const device = await deviceModel.getDataByImei(updateData.imei);

                if (!device) {
                    return errorResponse(res, 'Device with this IMEI does not exist', 400);
                }
            }

            const vehicleModel = new VehicleModel();

            console.log('UPDATE IMEI: ', updateData.imei);
            console.log('PARAMS IMEI: ', imei);
            if (updateData.imei !== imei) {
                const imeiExists = await vehicleModel.getDataByImei(updateData.imei);
                console.log('IMEI EXISTS: ', imeiExists);
                if (imeiExists) {
                    console.log('Bhettyo');
                    return errorResponse(res, 'Vehicle with this IMEI already exists', 400);
                }
            }

            const vehicle = await vehicleModel.updateData(imei, updateData);

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found', 404);
            }

            return successResponse(res, vehicle, 'Vehicle updated successfully');
        } catch (error) {
            console.error('Error in updateVehicle:', error);
            return errorResponse(res, 'Failed to update vehicle', 500);
        }
    }

    // Delete vehicle
    static async deleteVehicle(req, res) {
        try {
            const { imei } = req.params;
            const vehicleModel = new VehicleModel();
            const result = await vehicleModel.deleteData(imei);

            if (!result) {
                return errorResponse(res, 'Vehicle not found', 404);
            }

            return successResponse(res, null, 'Vehicle deleted successfully');
        } catch (error) {
            console.error('Error in deleteVehicle:', error);
            return errorResponse(res, 'Failed to delete vehicle', 500);
        }
    }
}

module.exports = VehicleController;