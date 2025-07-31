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

     // Get all vehicles with latest status and location
     static async getAllVehiclesWithData(req, res) {
        try {
            const vehicleModel = new VehicleModel();
            const vehicles = await vehicleModel.getAllDataWithStatusAndLocationData();

            return successResponse(res, vehicles, 'Vehicles with data retrieved successfully');
        } catch (error) {
            console.error('Error in getAllVehiclesWithData:', error);
            return errorResponse(res, 'Failed to retrieve vehicles with data', 500);
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

    // Get vehicle by IMEI with latest status and location
    static async getVehicleByImeiWithData(req, res) {
        try {
            const { imei } = req.params;
            const vehicleModel = new VehicleModel();
            const vehicle = await vehicleModel.getDataByImeiWithStatusAndLocationData(imei);

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found', 404);
            }

            return successResponse(res, vehicle, 'Vehicle with data retrieved successfully');
        } catch (error) {
            console.error('Error in getVehicleByImeiWithData:', error);
            return errorResponse(res, 'Failed to retrieve vehicle with data', 500);
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
            const existingVehicle = await vehicleModel.getDataByImei(vehicleData.imei);

            if (existingVehicle) {
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

            console.log('Original IMEI:', imei);
            console.log('Update data IMEI:', updateData.imei);
            
            // Only check for device existence and vehicle duplicates if IMEI is being changed
            if (updateData.imei && updateData.imei !== imei) {
                console.log('IMEI is being changed from', imei, 'to', updateData.imei);
                
                // Check if device exists
                const deviceModel = new DeviceModel();
                const device = await deviceModel.getDataByImei(updateData.imei);
                
                if (!device) {
                    return errorResponse(res, 'Device with this IMEI does not exist', 400);
                }
                
                // Check if another vehicle with the new IMEI already exists
                const vehicleModel = new VehicleModel();
                const existingVehicle = await vehicleModel.getDataByImei(updateData.imei);
                
                if (existingVehicle) {
                    return errorResponse(res, 'Vehicle with this IMEI already exists', 400);
                }
            }
            
            const vehicleModel = new VehicleModel();
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