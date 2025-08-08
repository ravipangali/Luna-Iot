const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification_controller');
const AuthMiddleware = require('../middleware/auth_middleware');
const { corsMiddleware } = require('../middleware/cors_middleware');

router.use(corsMiddleware);

// Admin routes (Super Admin only)
router.get('/notifications', NotificationController.getAllNotifications);
router.post('/notification/create', NotificationController.createNotification);
router.delete('/notification/:id', NotificationController.deleteNotification);

// User routes
router.get('/user/notifications', NotificationController.getUserNotifications);
router.get('/user/notifications/unread-count', NotificationController.getUnreadNotificationCount);
router.put('/user/notification/:notificationId/read', NotificationController.markNotificationAsRead);

// FCM token update
router.put('/fcm-token', NotificationController.updateFcmToken);

module.exports = router;