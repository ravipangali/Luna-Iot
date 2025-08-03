const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth_controller');
const AuthMiddleware = require('../middleware/auth_middleware');

// Register
router.post('/register', AuthController.register);

// Login
router.post('/login', AuthController.login);

// Logout (protected)
router.post('/logout', AuthMiddleware.verifyToken, AuthController.logout);

module.exports = router;