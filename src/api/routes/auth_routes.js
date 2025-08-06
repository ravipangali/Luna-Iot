const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth_controller');
const AuthMiddleware = require('../middleware/auth_middleware');

// Public routes (no authentication required)
router.post('/register/send-otp', AuthController.sendRegistrationOTP);
router.post('/register/verify-otp', AuthController.verifyOTPAndRegister);
router.post('/register/resend-otp', AuthController.resendOTP);
router.post('/login', AuthController.login);

// Protected routes (authentication required)
router.post('/logout', AuthMiddleware.verifyToken, AuthController.logout);
router.get('/me', AuthMiddleware.verifyToken, AuthController.getCurrentUser);

module.exports = router;