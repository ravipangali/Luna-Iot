const UserModel = require('../../database/models/UserModel');
const { successResponse, errorResponse } = require('../utils/response_handler');

class UserController {
    static async getAllUsers(req, res) {
        try {
            const userModel = new UserModel();
            const users = await userModel.getAllUsers();
            return successResponse(res, users, 'Users retrieved successfully');
        } catch (error) {
            return errorResponse(res, 'Failed to retrieve users', 500);
        }
    }

    static async getUserByPhone(req, res) {
        try {
            const { phone } = req.params;
            const userModel = new UserModel();
            const user = await userModel.getUserByPhone(phone);
            if (!user) {
                return errorResponse(res, 'User not found', 404);
            }
            return successResponse(res, user, 'User retrieved successfully');
        } catch (error) {
            return errorResponse(res, 'Failed to retrieve user', 500);
        }
    }

    static async updateUser(req, res) {
        try {
            const { phone } = req.params;
            const updateData = req.body;
            const userModel = new UserModel();
            const user = await userModel.updateUser(phone, updateData);
            return successResponse(res, user, 'User updated successfully');
        } catch (error) {
            return errorResponse(res, 'Failed to update user', 500);
        }
    }

    static async deleteUser(req, res) {
        try {
            const { phone } = req.params;
            const userModel = new UserModel();
            await userModel.deleteUser(phone);
            return successResponse(res, null, 'User deleted successfully');
        } catch (error) {
            return errorResponse(res, 'Failed to delete user', 500);
        }
    }
}

module.exports = UserController;