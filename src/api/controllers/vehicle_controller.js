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
            
            // Super Admin: all access
            if (user.role.name === 'Super Admin') {
                const vehicles = await vehicleModel.getAllData();
                return successResponse(res, vehicles, 'Vehicles retrieved successfully');
            } 
            // Dealer: vehicles from assigned devices + directly assigned vehicles
            else if (user.role.name === 'Dealer') {
                const vehicles = await vehicleModel.getVehiclesForDealer(user.id);
                return successResponse(res, vehicles, 'Dealer vehicles retrieved successfully');
            } 
            // Customer: only directly assigned vehicles
            else {
                const vehicles = await vehicleModel.getVehiclesByUserId(user.id);
                return successResponse(res, vehicles, 'Customer vehicles retrieved successfully');
            }
        } catch (error) {
            console.error('Error in getAllVehicles:', error);
            return errorResponse(res, 'Failed to retrieve vehicles', 500);
        }
    }

    // Get all vehicles with latest status and location
    static async getAllVehiclesWithData(req, res) {
        try {
            const user = req.user;
            const vehicleModel = new VehicleModel();
            
            // Super Admin: all access
            if (user.role.name === 'Super Admin') {
                const vehicles = await vehicleModel.getAllDataWithStatusAndLocationData();
                return successResponse(res, vehicles, 'Vehicles with data retrieved successfully');
            } 
            // Dealer: vehicles from assigned devices + directly assigned vehicles
            else if (user.role.name === 'Dealer') {
                const vehicles = await vehicleModel.getVehiclesForDealerWithStatusAndLocationData(user.id);
                return successResponse(res, vehicles, 'Dealer vehicles with data retrieved successfully');
            } 
            // Customer: only directly assigned vehicles
            else {
                const vehicles = await vehicleModel.getVehiclesByUserIdWithStatusAndLocationData(user.id);
                return successResponse(res, vehicles, 'Customer vehicles with data retrieved successfully');
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
            
            // Super Admin: can access any vehicle
            if (user.role.name === 'Super Admin') {
                vehicle = await vehicleModel.getDataByImei(imei);
            } 
            // Dealer: can access vehicles from assigned devices or directly assigned
            else if (user.role.name === 'Dealer') {
                vehicle = await vehicleModel.getVehicleByImeiForDealer(imei, user.id);
            } 
            // Customer: can only access directly assigned vehicles
            else {
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
            
            // Super Admin: can access any vehicle
            if (user.role.name === 'Super Admin') {
                vehicle = await vehicleModel.getDataByImeiWithStatusAndLocationData(imei);
            } 
            // Dealer: can access vehicles from assigned devices or directly assigned
            else if (user.role.name === 'Dealer') {
                vehicle = await vehicleModel.getVehicleByImeiWithStatusAndLocationDataForDealer(imei, user.id);
            } 
            // Customer: can only access directly assigned vehicles
            else {
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

    // Create new vehicle (Super Admin, Dealer, Customer can create)
    static async createVehicle(req, res) {
        try {
            const user = req.user;
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
    
            // Create vehicle with user-vehicle relationship
            const vehicle = await vehicleModel.createData(vehicleData, user.id);
            return successResponse(res, vehicle, 'Vehicle created successfully', 201);
        } catch (error) {
            console.error('Error in createVehicle:', error);
            return errorResponse(res, 'Failed to create vehicle', 500);
        }
    }

    // Update vehicle (Super Admin, Dealer, Customer can update)
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
            
            // Super Admin: can update any vehicle
            if (user.role.name === 'Super Admin') {
                vehicle = await vehicleModel.updateData(imei, updateData);
            } 
            // Dealer: can update vehicles from assigned devices or directly assigned
            else if (user.role.name === 'Dealer') {
                const dealerVehicle = await vehicleModel.getVehicleByImeiForDealer(imei, user.id);
                if (!dealerVehicle) {
                    return errorResponse(res, 'Vehicle not found or access denied', 404);
                }
                vehicle = await vehicleModel.updateData(imei, updateData);
            } 
            // Customer: can only update directly assigned vehicles
            else {
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

    // Delete vehicle (only Super Admin)
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