const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../../database/prisma');
const { successResponse, errorResponse } = require('../utils/response_handler');
const OtpModel = require('../../database/models/OtpModel');
const smsService = require('../../services/sms_service');


class AuthController {
    // Generate random token
    static generateToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    // Generate OTP
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // Get Current User
    static async getCurrentUser(req, res) {
        try {
            const userId = req.user.id;
            
            const user = await prisma.getClient().user.findUnique({
                where: { id: userId },
                include: {
                    role: true
                }
            });

            if (!user) {
                return errorResponse(res, 'User not found', 404);
            }

            return successResponse(res, 'User data retrieved successfully', {
                id: user.id,
                name: user.name,
                phone: user.phone,
                status: user.status,
                role: user.role.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            });
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }

    // Send OTP for registration
    static async sendRegistrationOTP(req, res) {
        try {
            const { phone } = req.body;

            if (!phone) {
                return errorResponse(res, 'Phone number is required', 400);
            }

            // Check if user already exists
            const existingUser = await prisma.getClient().user.findUnique({
                where: { phone }
            });

            if (existingUser) {
                return errorResponse(res, 'User already exists', 400);
            }

            // Generate OTP
            const otp = AuthController.generateOTP();
            const otpModel = new OtpModel();

            // Save OTP to database
            await otpModel.createOTP(phone, otp);

            // Send SMS
            const smsResult = await smsService.sendOTP(phone, otp);

            if (smsResult.success) {
                return successResponse(res, 'OTP sent successfully', {
                    phone: phone,
                    message: 'OTP sent to your phone number'
                });
            } else {
                return errorResponse(res, 'Failed to send OTP', 500);
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            return errorResponse(res, error.message, 500);
        }
    }


    // Verify OTP and register user
    static async verifyOTPAndRegister(req, res) {
        try {
            const { name, phone, password, otp } = req.body;

            if (!name || !phone || !password || !otp) {
                return errorResponse(res, 'All fields are required', 400);
            }

            // Check if user already exists
            const existingUser = await prisma.getClient().user.findUnique({
                where: { phone }
            });

            if (existingUser) {
                return errorResponse(res, 'User already exists', 400);
            }

            // Verify OTP
            const otpModel = new OtpModel();
            const otpRecord = await otpModel.verifyOTP(phone, otp);

            if (!otpRecord) {
                return errorResponse(res, 'Invalid or expired OTP', 400);
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
                    role: true
                }
            });

            // Delete OTP after successful registration
            await otpModel.deleteOTP(phone);

            return successResponse(res, 'User registered successfully', {
                id: user.id,
                name: user.name,
                phone: user.phone,
                token: user.token,
                role: user.role.name
            });
        } catch (error) {
            console.error('Registration error:', error);
            return errorResponse(res, error.message, 500);
        }
    }

    // Resend OTP
    static async resendOTP(req, res) {
        try {
            const { phone } = req.body;

            if (!phone) {
                return errorResponse(res, 'Phone number is required', 400);
            }

            // Check if user already exists
            const existingUser = await prisma.getClient().user.findUnique({
                where: { phone }
            });

            if (existingUser) {
                return errorResponse(res, 'User already exists', 400);
            }

            // Generate new OTP
            const otp = AuthController.generateOTP();
            const otpModel = new OtpModel();

            // Save new OTP to database
            await otpModel.createOTP(phone, otp);

            // Send SMS
            const smsResult = await smsService.sendOTP(phone, otp);

            if (smsResult.success) {
                return successResponse(res, 'OTP resent successfully', {
                    phone: phone,
                    message: 'New OTP sent to your phone number'
                });
            } else {
                return errorResponse(res, 'Failed to send OTP', 500);
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
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
                    role: true
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