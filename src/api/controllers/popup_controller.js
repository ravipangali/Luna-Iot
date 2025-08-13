const PopupModel = require('../../database/models/PopupModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class PopupController {
    // Get all active popups (public endpoint)
    static async getActivePopups(req, res) {
        try {
            const popupModel = new PopupModel();
            const popups = await popupModel.getActivePopups();
            
            return successResponse(res, popups, 'Active popups retrieved successfully');
        } catch (error) {
            console.error('Error in getActivePopups: ', error);
            return errorResponse(res, 'Failed to retrieve popups', 500);
        }
    }

    // Get all popups (only Super Admin)
    static async getAllPopups(req, res) {
        try {
            const user = req.user;
            
            // Only Super Admin can view all popups
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can view all popups', 403);
            }
            
            const popupModel = new PopupModel();
            const popups = await popupModel.getAllPopups();
            
            return successResponse(res, popups, 'All popups retrieved successfully');
        } catch (error) {
            console.error('Error in getAllPopups: ', error);
            return errorResponse(res, 'Failed to retrieve popups', 500);
        }
    }

    // Get popup by ID (only Super Admin)
    static async getPopupById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            
            // Only Super Admin can view popup details
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can view popup details', 403);
            }
            
            const popupModel = new PopupModel();
            const popup = await popupModel.getPopupById(id);
            
            if (!popup) {
                return errorResponse(res, 'Popup not found', 404);
            }
            
            return successResponse(res, popup, 'Popup retrieved successfully');
        } catch (error) {
            console.error('Error in getPopupById: ', error);
            return errorResponse(res, 'Failed to retrieve popup', 500);
        }
    }

    // Create new popup (only Super Admin)
    static async createPopup(req, res) {
        try {
            const user = req.user;
            
            // Only Super Admin can create popups
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can create popups', 403);
            }
            
            const popupData = req.body;
            const popupModel = new PopupModel();
            const popup = await popupModel.createPopup(popupData);
            
            return successResponse(res, popup, 'Popup created successfully', 201);
        } catch (error) {
            console.error('Error in createPopup:', error);
            return errorResponse(res, 'Failed to create popup', 500);
        }
    }

    // Update popup (only Super Admin)
    static async updatePopup(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            
            // Only Super Admin can update popups
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can update popups', 403);
            }
            
            const updateData = req.body;
            const popupModel = new PopupModel();
            const popup = await popupModel.updatePopup(id, updateData);
            
            return successResponse(res, popup, 'Popup updated successfully');
        } catch (error) {
            console.error('Error in updatePopup:', error);
            return errorResponse(res, 'Failed to update popup', 500);
        }
    }

    // Delete popup (only Super Admin)
    static async deletePopup(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            
            // Only Super Admin can delete popups
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can delete popups', 403);
            }
            
            const popupModel = new PopupModel();
            await popupModel.deletePopup(id);
            
            return successResponse(res, null, 'Popup deleted successfully');
        } catch (error) {
            console.error('Error in deletePopup:', error);
            return errorResponse(res, 'Failed to delete popup', 500);
        }
    }
}

module.exports = PopupController;