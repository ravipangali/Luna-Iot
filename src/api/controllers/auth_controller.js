const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../../database/prisma');
const { successResponse, errorResponse } = require('../utils/response_handler');


class AuthController {
    // Generate random token
    static generateToken() {
        return crypto.randomBytes(64).toString('hex');
    }
    

    // User registration
    static async register(req, res) {
        try {
            const { name, phone, password } = req.body;

            // Check if user already exists
            const existingUser = await prisma.getClient().user.findUnique({
                where: { phone }
            });

            if (existingUser) {
                return errorResponse(res, 'User already exists', 400);
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Generate token
            const token = AuthController.generateToken();

            // Get default role (assuming role ID 1 is for regular users)
            const defaultRole = await prisma.getClient().role.findFirst({
                where: { name: 'Customer' }
            });

            if (!defaultRole) {
                return errorResponse(res, 'Default role not found', 500);
            }

            // Create user
            const user = await prisma.getClient().user.create({
                data: {
                    name,
                    phone,
                    password: hashedPassword,
                    token,
                    roleId: defaultRole.id
                },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
        
            });

            return successResponse(res, 'User registered successfully', {
                id: user.id,
                name: user.name,
                phone: user.phone,
                token: user.token,
                role: user.role.name
            });
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }

    // User login
    static async login(req, res) {
        try {
            const { phone, password } = req.body;

            // Find user by phone
            const user = await prisma.getClient().user.findUnique({
                where: { phone },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });

            if (!user) {
                return errorResponse(res, 'User not found', 404);
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return errorResponse(res, 'Invalid credentials', 401);
            }

            // Generate new token and update user
            const token = AuthController.generateToken();
            await prisma.getClient().user.update({
                where: { id: user.id },
                data: {
                    token,
                }
            });

            return successResponse(res, 'Login successful', {
                id: user.id,
                name: user.name,
                phone: user.phone,
                token,
                role: user.role.name
            });
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }

    // User logout
    static async logout(req, res) {
        try {
            const userId = req.user.id;
            await prisma.getClient().user.update({
                where: { id: userId },
                data: { token: null }
            });
            return successResponse(res, 'Logout successful');
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
}


module.exports = AuthController;