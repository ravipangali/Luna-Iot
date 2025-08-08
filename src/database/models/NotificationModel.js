const prisma = require('../prisma');

class NotificationModel {
    async createNotification(data) {
        try {
            const notification = await prisma.getClient().notification.create({
                data: {
                    title: data.title,
                    message: data.message,
                    type: data.type, // 'all', 'specific', 'role'
                    targetUsers: data.targetUsers ? JSON.stringify(data.targetUsers) : null,
                    targetRoles: data.targetRoles ? JSON.stringify(data.targetRoles) : null,
                    sentById: data.sentById
                },
                include: {
                    sentBy: {
                        include: {
                            role: true
                        }
                    }
                }
            });
            return notification;
        } catch (error) {
            console.error('NOTIFICATION CREATION ERROR', error);
            throw error;
        }
    }

    async getAllNotifications() {
        try {
            return await prisma.getClient().notification.findMany({
                include: {
                    sentBy: {
                        include: {
                            role: true
                        }
                    },
                    userNotifications: {
                        include: {
                            user: {
                                include: {
                                    role: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING ALL NOTIFICATIONS', error);
            throw error;
        }
    }

    async getNotificationById(id) {
        try {
            return await prisma.getClient().notification.findUnique({
                where: { id },
                include: {
                    sentBy: {
                        include: {
                            role: true
                        }
                    },
                    userNotifications: {
                        include: {
                            user: {
                                include: {
                                    role: true
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING NOTIFICATION BY ID', error);
            throw error;
        }
    }

    async deleteNotification(id) {
        try {
            return await prisma.getClient().notification.delete({
                where: { id }
            });
        } catch (error) {
            console.error('ERROR DELETING NOTIFICATION', error);
            throw error;
        }
    }

    async getUserNotifications(userId) {
        try {
            return await prisma.getClient().userNotification.findMany({
                where: { userId },
                include: {
                    notification: {
                        include: {
                            sentBy: {
                                include: {
                                    role: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING USER NOTIFICATIONS', error);
            throw error;
        }
    }

    async markNotificationAsRead(userId, notificationId) {
        try {
            return await prisma.getClient().userNotification.update({
                where: {
                    userId_notificationId: {
                        userId: userId,
                        notificationId: notificationId
                    }
                },
                data: {
                    isRead: true
                }
            });
        } catch (error) {
            console.error('ERROR MARKING NOTIFICATION AS READ', error);
            throw error;
        }
    }

    async getUnreadNotificationCount(userId) {
        try {
            const count = await prisma.getClient().userNotification.count({
                where: {
                    userId: userId,
                    isRead: false
                }
            });
            return count;
        } catch (error) {
            console.error('ERROR FETCHING UNREAD NOTIFICATION COUNT', error);
            throw error;
        }
    }
}

module.exports = NotificationModel;