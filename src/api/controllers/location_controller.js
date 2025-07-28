// src/api/controllers/location_controller.js
const LocationModel = require('../../database/models/LocationModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class LocationController {
    // Get location history by IMEI
    static async getLocationByImei(req, res) {
        try {
            const { imei } = req.params;
            const locationModel = new LocationModel();
            const locations = await locationModel.getDataByImei(imei);
            
            return successResponse(res, locations, 'Location history retrieved successfully');
        } catch (error) {
            console.error('Error in getLocationByImei:', error);
            return errorResponse(res, 'Failed to retrieve location history', 500);
        }
    }

    // Get latest location by IMEI
    static async getLatestLocation(req, res) {
        try {
            const { imei } = req.params;
            const locationModel = new LocationModel();
            const location = await locationModel.getLatest(imei);
            
            if (!location) {
                return errorResponse(res, 'No location data found', 404);
            }
            
            return successResponse(res, location, 'Latest location retrieved successfully');
        } catch (error) {
            console.error('Error in getLatestLocation:', error);
            return errorResponse(res, 'Failed to retrieve latest location', 500);
        }
    }

    // Get location by date range
    static async getLocationByDateRange(req, res) {
        try {
            const { imei } = req.params;
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return errorResponse(res, 'Start date and end date are required', 400);
            }
            
            const locationModel = new LocationModel();
            const locations = await locationModel.getDataByDateRange(
                imei, 
                new Date(startDate), 
                new Date(endDate)
            );
            
            return successResponse(res, locations, 'Location data retrieved successfully');
        } catch (error) {
            console.error('Error in getLocationByDateRange:', error);
            return errorResponse(res, 'Failed to retrieve location data', 500);
        }
    }
}

module.exports = LocationController;