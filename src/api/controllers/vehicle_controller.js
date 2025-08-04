// src/api/controllers/vehicle_controller.js
const VehicleModel = require('../../database/models/VehicleModel');
const DeviceModel = require('../../database/models/DeviceModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class VehicleController {
    // Get all vehicles
    static async getAllVehicles(req, res) {
        try {
            const user = req.user;
            const vehicleModel = new VehicleModel();
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin sees all vehicles
                const vehicles = await vehicleModel.getAllData();
                return successResponse(res, vehicles, 'Vehicles retrieved successfully');
            } else {
                // Regular users see only their assigned vehicles
                const vehicles = await vehicleModel.getVehiclesByUserId(user.id);
                return successResponse(res, vehicles, 'User vehicles retrieved successfully');
            }
        }  catch (error) {
            console.error('Error in getAllVehicles:', error);
            return errorResponse(res, 'Failed to retrieve vehicles', 500);
        }
    }

     // Get all vehicles with latest status and location
     static async getAllVehiclesWithData(req, res) {
        try{
            const user = req.user;
            const vehicleModel = new VehicleModel();
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin sees all vehicles
                const vehicles = await vehicleModel.getAllDataWithStatusAndLocationData();
                return successResponse(res, vehicles, 'Vehicles with data retrieved successfully');
            } else {
                // Regular users see only their assigned vehicles
                const vehicles = await vehicleModel.getVehiclesByUserIdWithStatusAndLocationData(user.id);
                return successResponse(res, vehicles, 'User vehicles with data retrieved successfully');
            }
        } catch (error) {
            console.error('Error in getAllVehiclesWithData:', error);
            return errorResponse(res, 'Failed to retrieve vehicles with data', 500);
        }
    }


    // Get vehicle by IMEI
    static async getVehicleByImei(req, res) {
        try {
            const { imei } = req.params;
            const user = req.user;
            const vehicleModel = new VehicleModel();
            
            let vehicle;
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin can access any vehicle
                vehicle = await vehicleModel.getDataByImei(imei);
            } else {
                // Regular users can only access their assigned vehicles
                vehicle = await vehicleModel.getVehicleByImeiForUser(imei, user.id);
            }

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
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
            const user = req.user;
            const vehicleModel = new VehicleModel();
            
            let vehicle;
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin can access any vehicle
                vehicle = await vehicleModel.getDataByImeiWithStatusAndLocationData(imei);
            } else {
                // Regular users can only access their assigned vehicles
                vehicle = await vehicleModel.getVehicleByImeiWithStatusAndLocationDataForUser(imei, user.id);
            }

            if (!vehicle) {
                return errorResponse(res, 'Vehicle not found or access denied', 404);
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
            const user = req.user;
            
            // Only Super Admin can create vehicles
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can create vehicles', 403);
            }
            
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
            const user = req.user;
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
            let vehicle;
            
            // Check if user is Super Admin
            if (user.role.name === 'Super Admin') {
                // Super Admin can update any vehicle
                vehicle = await vehicleModel.updateData(imei, updateData);
            } else {
                // Regular users can only update their assigned vehicles
                const userVehicle = await vehicleModel.getVehicleByImeiForUser(imei, user.id);
                if (!userVehicle) {
                    return errorResponse(res, 'Vehicle not found or access denied', 404);
                }
                vehicle = await vehicleModel.updateData(imei, updateData);
            }
            
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
            const user = req.user;
            
            // Only Super Admin can delete vehicles
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can delete vehicles', 403);
            }
            
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