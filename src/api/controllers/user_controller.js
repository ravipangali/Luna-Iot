const UserModel = require('../../database/models/UserModel');
const { successResponse, errorResponse } = require('../utils/response_handler');
const bcrypt = require('bcryptjs');

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

    static async createUser(req, res) {
        try {
            const { name, phone, password, roleId, status } = req.body;
            if (!name || !phone || !password || !roleId) {
                return errorResponse(res, 'Missing required fields', 400);
            }
            // Check if user already exists
            const userModel = new UserModel();
            const existing = await userModel.getUserByPhone(phone);
            if (existing) {
                return errorResponse(res, 'User already exists', 400);
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            const user = await userModel.createUser({
                name,
                phone,
                password: hashedPassword,
                roleId,
                status: status || 'ACTIVE'
            });
            return successResponse(res, user, 'User created successfully', 201);
        } catch (error) {
            return errorResponse(res, 'Failed to create user', 500);
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