const NotificationModel = require('../../database/models/NotificationModel');
const UserModel = require('../../database/models/UserModel');
const { successResponse, errorResponse } = require('../utils/response_handler');
const firebaseService = require('../../utils/firebase_service');
const prisma = require('../../database/prisma'); 

class NotificationController {
    // Get all notifications (admin only)
    static async getAllNotifications(req, res) {
        try {
            const user = req.user;
            
            // Only Super Admin can view all notifications
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can view all notifications', 403);
            }
            
            const notificationModel = new NotificationModel();
            const notifications = await notificationModel.getAllNotifications();
            
            return successResponse(res, notifications, 'Notifications retrieved successfully');
        } catch (error) {
            console.error('Error in getAllNotifications:', error);
            return errorResponse(res, 'Failed to retrieve notifications', 500);
        }
    }

    // Get user's notifications
    static async getUserNotifications(req, res) {
        try {
            const userId = req.user.id;
            const notificationModel = new NotificationModel();
            const notifications = await notificationModel.getUserNotifications(userId);
            
            return successResponse(res, notifications, 'User notifications retrieved successfully');
        } catch (error) {
            console.error('Error in getUserNotifications:', error);
            return errorResponse(res, 'Failed to retrieve user notifications', 500);
        }
    }

    // Get unread notification count
    static async getUnreadNotificationCount(req, res) {
        try {
            const userId = req.user.id;
            const notificationModel = new NotificationModel();
            const count = await notificationModel.getUnreadNotificationCount(userId);
            
            return successResponse(res, { count }, 'Unread notification count retrieved successfully');
        } catch (error) {
            console.error('Error in getUnreadNotificationCount:', error);
            return errorResponse(res, 'Failed to retrieve unread notification count', 500);
        }
    }

    // Mark notification as read
    static async markNotificationAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;
            
            const notificationModel = new NotificationModel();
            await notificationModel.markNotificationAsRead(userId, parseInt(notificationId));
            
            return successResponse(res, null, 'Notification marked as read successfully');
        } catch (error) {
            console.error('Error in markNotificationAsRead:', error);
            return errorResponse(res, 'Failed to mark notification as read', 500);
        }
    }

    // Create and send notification
    static async createNotification(req, res) {
        try {
            const user = req.user;
            
            // Only Super Admin can create notifications
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can create notifications', 403);
            }
            
            const { title, message, type, targetUsers, targetRoles } = req.body;
            
            if (!title || !message || !type) {
                return errorResponse(res, 'Title, message, and type are required', 400);
            }
            
            const notificationModel = new NotificationModel();
            const userModel = new UserModel();
            
            // Create notification
            const notification = await notificationModel.createNotification({
                title,
                message,
                type,
                targetUsers,
                targetRoles,
                sentById: user.id
            });
            
            // Send push notifications
            let fcmTokens = [];
            
            if (type === 'all') {
                // Get all active users' FCM tokens
                const allUsers = await userModel.getAllUsers();
                fcmTokens = allUsers
                    .filter(u => u.fcmToken && u.status === 'ACTIVE')
                    .map(u => u.fcmToken);
            } else if (type === 'specific' && targetUsers) {
                // Get specific users' FCM tokens
                const targetUserIds = JSON.parse(targetUsers);
                const specificUsers = await Promise.all(
                    targetUserIds.map(id => userModel.getUserById(id))
                );
                fcmTokens = specificUsers
                    .filter(u => u && u.fcmToken && u.status === 'ACTIVE')
                    .map(u => u.fcmToken);
            } else if (type === 'role' && targetRoles) {
                // Get users by role FCM tokens
                const roleNames = JSON.parse(targetRoles);
                const roleUsers = await prisma.getClient().user.findMany({
                    where: {
                        role: {
                            name: {
                                in: roleNames
                            }
                        },
                        status: 'ACTIVE',
                        fcmToken: {
                            not: null
                        }
                    }
                });
                fcmTokens = roleUsers.map(u => u.fcmToken);
            }
            
            // Send push notifications
            if (fcmTokens.length > 0) {
                await firebaseService.sendNotificationToMultipleUsers(fcmTokens, title, message);
            }
            
            return successResponse(res, notification, 'Notification created and sent successfully', 201);
        } catch (error) {
            console.error('Error in createNotification:', error);
            return errorResponse(res, 'Failed to create notification', 500);
        }
    }

    // Delete notification (admin only)
    static async deleteNotification(req, res) {
        try {
            const user = req.user;
            
            // Only Super Admin can delete notifications
            if (user.role.name !== 'Super Admin') {
                return errorResponse(res, 'Access denied. Only Super Admin can delete notifications', 403);
            }
            
            const { id } = req.params;
            const notificationModel = new NotificationModel();
            await notificationModel.deleteNotification(parseInt(id));
            
            return successResponse(res, null, 'Notification deleted successfully');
        } catch (error) {
            console.error('Error in deleteNotification:', error);
            return errorResponse(res, 'Failed to delete notification', 500);
        }
    }

    static async updateFcmToken(req, res) {
        try {
            const { fcmToken, phone } = req.body; // Get phone from request body
            const userPhone = phone || req.user.phone; // Fallback to auth middleware phone
            
            console.log('Updating FCM token for user phone:', userPhone);
            console.log('FCM Token:', fcmToken);
            
            if (!fcmToken) {
                return errorResponse(res, 'FCM token is required', 400);
            }
            
            if (!userPhone) {
                return errorResponse(res, 'User phone is required', 400);
            }
            
            // First check if user exists
            const userModel = new UserModel();
            const existingUser = await userModel.getUserByPhone(userPhone);
            
            if (!existingUser) {
                console.log('User not found for phone:', userPhone);
                return errorResponse(res, 'User not found', 404);
            }
            
            // Update using phone number
            const updatedUser = await prisma.getClient().user.update({
                where: { phone: userPhone },
                data: { fcmToken }
            });
            
            console.log('FCM token updated successfully for user phone:', userPhone);
            return successResponse(res, 'FCM token updated successfully', null);
        } catch (error) {
            console.error('Error in updateFcmToken:', error);
            
            // Handle specific Prisma errors
            if (error.code === 'P2025') {
                return errorResponse(res, 'User not found for FCM token update', 404);
            }
            
            return errorResponse(res, 'Failed to update FCM token', 500);
        }
    }
}

module.exports = NotificationController;