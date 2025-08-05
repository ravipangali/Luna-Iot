const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth_controller');
const AuthMiddleware = require('../middleware/auth_middleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthMiddleware.verifyToken, AuthController.logout);
router.get('/me', AuthMiddleware.verifyToken, AuthController.getCurrentUser);

module.exports = router;