const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification_controller');
const AuthMiddleware = require('../middleware/auth_middleware');
const { corsMiddleware } = require('../middleware/cors_middleware');

router.use(corsMiddleware);

// Admin routes (Super Admin only)
router.get('/notifications', AuthMiddleware.verifyToken, NotificationController.getAllNotifications);
router.post('/notification/create', AuthMiddleware.verifyToken, NotificationController.createNotification);
router.delete('/notification/:id', AuthMiddleware.verifyToken, NotificationController.deleteNotification);

// User routes
router.get('/user/notifications', AuthMiddleware.verifyToken, NotificationController.getUserNotifications);
router.get('/user/notifications/unread-count', AuthMiddleware.verifyToken, NotificationController.getUnreadNotificationCount);
router.put('/user/notification/:notificationId/read', AuthMiddleware.verifyToken, NotificationController.markNotificationAsRead);

// FCM token update
router.put('/user/fcm-token', AuthMiddleware.verifyToken, NotificationController.updateFcmToken);

module.exports = router;