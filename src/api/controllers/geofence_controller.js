const GeofenceModel = require('../../database/models/GeofenceModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class GeofenceController {
    // Create new geofence
    static async createGeofence(req, res) {
        try {
            const user = req.user;
            const { title, type, boundary, vehicleIds, userIds } = req.body;

            // Validate required fields
            if (!title || !type || !boundary) {
                return errorResponse(res, 'Title, type, and boundary are required', 400);
            }

            // Validate type
            if (!['Entry', 'Exit'].includes(type)) {
                return errorResponse(res, 'Type must be Entry or Exit', 400);
            }

            // Validate boundary format (should be array of lat-long strings)
            if (!Array.isArray(boundary) || boundary.length < 3) {
                return errorResponse(res, 'Boundary must be an array of at least 3 lat-long coordinates', 400);
            }

            const geofenceModel = new GeofenceModel();
            
            // Create geofence
            const geofence = await geofenceModel.createGeofence({
                title,
                type,
                boundary,
            });

            // Assign to vehicles if provided
            if (vehicleIds && vehicleIds.length > 0) {
                await geofenceModel.assignGeofenceToVehicles(geofence.id, vehicleIds);
            }

            // Assign to users if provided
            if (userIds && userIds.length > 0) {
                await geofenceModel.assignGeofenceToUsers(geofence.id, userIds);
            }

            // Get updated geofence with assignments
            const updatedGeofence = await geofenceModel.getGeofenceById(geofence.id);

            return successResponse(res, updatedGeofence, 'Geofence created successfully', 201);
        } catch (error) {
            console.error('Error in createGeofence:', error);
            return errorResponse(res, 'Failed to create geofence', 500);
        }
    }

    // Get all geofences
    static async getAllGeofences(req, res) {
        try {
            const user = req.user;
            const geofenceModel = new GeofenceModel();
            
            // Super Admin: all access
            if (user.role.name === 'Super Admin') {
                const geofences = await geofenceModel.getAllGeofences();
                return successResponse(res, geofences, 'Geofences retrieved successfully');
            } 
            // Dealer: only view assigned geofences
            else if (user.role.name === 'Dealer') {
                const geofences = await geofenceModel.getAllGeofences();
                // Filter to only show geofences assigned to this user
                const userGeofences = geofences.filter(geofence => 
                    geofence.users.some(u => u.userId === user.id)
                );
                return successResponse(res, userGeofences, 'Dealer geofences retrieved successfully');
            } 
            // Customer: only view assigned geofences
            else {
                const geofences = await geofenceModel.getAllGeofences();
                // Filter to only show geofences assigned to this user
                const userGeofences = geofences.filter(geofence => 
                    geofence.users.some(u => u.userId === user.id)
                );
                return successResponse(res, userGeofences, 'Customer geofences retrieved successfully');
            }
        } catch (error) {
            console.error('Error in getAllGeofences:', error);
            return errorResponse(res, 'Failed to retrieve geofences', 500);
        }
    }

    // Get geofence by ID
    static async getGeofenceById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const geofenceModel = new GeofenceModel();
            
            const geofence = await geofenceModel.getGeofenceById(id);
            
            if (!geofence) {
                return errorResponse(res, 'Geofence not found', 404);
            }

            // Check access based on role
            if (user.role.name !== 'Super Admin') {
                // Check if user has access to this geofence
                const hasAccess = geofence.users.some(u => u.userId === user.id);
                if (!hasAccess) {
                    return errorResponse(res, 'Access denied to this geofence', 403);
                }
            }
            
            return successResponse(res, geofence, 'Geofence retrieved successfully');
        } catch (error) {
            console.error('Error in getGeofenceById:', error);
            return errorResponse(res, 'Failed to retrieve geofence', 500);
        }
    }

    // Get geofences by IMEI
    static async getGeofencesByImei(req, res) {
        try {
            const { imei } = req.params;
            const user = req.user;
            const geofenceModel = new GeofenceModel();
            
            let geofences;
            
            // Super Admin: can access any geofence
            if (user.role.name === 'Super Admin') {
                geofences = await geofenceModel.getGeofencesByImei(imei);
            } 
            // Dealer: can only access assigned geofences
            else if (user.role.name === 'Dealer') {
                geofences = await geofenceModel.getGeofencesByImei(imei);
                // Filter to only show geofences assigned to this user
                geofences = geofences.filter(geofence => 
                    geofence.users.some(u => u.userId === user.id)
                );
            } 
            // Customer: can only access assigned geofences
            else {
                geofences = await geofenceModel.getGeofencesByImei(imei);
                // Filter to only show geofences assigned to this user
                geofences = geofences.filter(geofence => 
                    geofence.users.some(u => u.userId === user.id)
                );
            }
            
            return successResponse(res, geofences, 'Geofences retrieved successfully');
        } catch (error) {
            console.error('Error in getGeofencesByImei:', error);
            return errorResponse(res, 'Failed to retrieve geofences', 500);
        }
    }

    // Update geofence
    static async updateGeofence(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const updateData = req.body;
            
            const geofenceModel = new GeofenceModel();
            
            // Check if geofence exists
            const existingGeofence = await geofenceModel.getGeofenceById(id);
            if (!existingGeofence) {
                return errorResponse(res, 'Geofence not found', 404);
            }

            // Check access based on role
            if (user.role.name !== 'Super Admin') {
                // Check if user has access to this geofence
                const hasAccess = existingGeofence.users.some(u => u.userId === user.id);
                if (!hasAccess) {
                    return errorResponse(res, 'Access denied to this geofence', 403);
                }
            }

            // Update geofence
            const updatedGeofence = await geofenceModel.updateGeofence(id, updateData);
            
            if (!updatedGeofence) {
                return errorResponse(res, 'Geofence not found', 404);
            }

            // Update vehicle assignments if provided
            if (updateData.vehicleIds) {
                await geofenceModel.assignGeofenceToVehicles(id, updateData.vehicleIds);
            }

            // Update user assignments if provided
            if (updateData.userIds) {
                await geofenceModel.assignGeofenceToUsers(id, updateData.userIds);
            }

            // Get final updated geofence
            const finalGeofence = await geofenceModel.getGeofenceById(id);

            return successResponse(res, finalGeofence, 'Geofence updated successfully');
        } catch (error) {
            console.error('Error in updateGeofence:', error);
            return errorResponse(res, 'Failed to update geofence', 500);
        }
    }

    // Delete geofence
    static async deleteGeofence(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            
            const geofenceModel = new GeofenceModel();
            
            // Check if geofence exists
            const existingGeofence = await geofenceModel.getGeofenceById(id);
            if (!existingGeofence) {
                return errorResponse(res, 'Geofence not found', 404);
            }

            // Check access based on role
            if (user.role.name !== 'Super Admin') {
                // Check if user has access to this geofence
                const hasAccess = existingGeofence.users.some(u => u.userId === user.id);
                if (!hasAccess) {
                    return errorResponse(res, 'Access denied to this geofence', 403);
                }
            }

            const result = await geofenceModel.deleteGeofence(id);
            
            if (!result) {
                return errorResponse(res, 'Geofence not found', 404);
            }
            
            return successResponse(res, null, 'Geofence deleted successfully');
        } catch (error) {
            console.error('Error in deleteGeofence:', error);
            return errorResponse(res, 'Failed to delete geofence', 500);
        }
    }
}

module.exports = GeofenceController;