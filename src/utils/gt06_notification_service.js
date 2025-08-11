const prisma = require('../database/prisma');
const firebaseService = require('./firebase_service');

class GT06NotificationService {
    
    // Send notification to all users who have access to a vehicle and notifications enabled
    static async sendVehicleNotification(imei, title, message, data = {}) {
        try {
            // Get vehicle details
            const vehicle = await prisma.getClient().vehicle.findUnique({
                where: { imei: imei.toString() },
                select: { id: true, vehicleNo: true }
            });

            if (!vehicle) {
                console.log(`Vehicle not found for IMEI: ${imei}`);
                return;
            }

            // Get all users who have access to this vehicle and notifications enabled
            const userVehicles = await prisma.getClient().userVehicle.findMany({
                where: {
                    vehicleId: vehicle.id,// Assuming 'events' permission includes notifications
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fcmToken: true,
                            name: true
                        }
                    }
                }
            });
            console.log(`Found ${userVehicles.length} users with access to vehicle ${vehicle.vehicleNo}`);

            // Filter users with FCM tokens
            const usersWithFcmTokens = userVehicles
                .map(uv => uv.user)
                .filter(user => user.fcmToken && user.fcmToken.trim() !== '');
            
            console.log(`Users with FCM tokens: ${usersWithFcmTokens.length}`);
            console.log('User details:', usersWithFcmTokens.map(u => ({ 
                id: u.id, 
                name: u.name, 
                fcmToken: u.fcmToken
            })));
            
            if (usersWithFcmTokens.length === 0) {
                console.log(`No users with FCM tokens found for vehicle: ${vehicle.vehicleNo}`);
                return;
            }
            
            // Extract FCM tokens
            const fcmTokens = usersWithFcmTokens.map(user => user.fcmToken);
            console.log(`FCM Tokens to send to: ${fcmTokens.length}`);
            console.log('First token sample:', fcmTokens[0]);
            
            // Send notification to all users
            const result = await firebaseService.sendNotificationToMultipleUsers(
                fcmTokens,
                title,
                message,
                {
                    ...data,
                    vehicleId: vehicle.id,
                    vehicleNo: vehicle.vehicleNo,
                    imei: imei
                }
            );
            
            console.log(`Firebase result:`, result);
            console.log(`Notification sent to ${fcmTokens.length} users for vehicle ${vehicle.vehicleNo}: ${title}`);
            return result;

        } catch (error) {
            console.error('Error sending vehicle notification:', error);
            throw error;
        }
    }

    // Check if ignition status changed and send notification
    static async checkIgnitionChangeAndNotify(imei, newIgnitionStatus) {
        try {
            console.log(`=== IGNITION CHECK DEBUG ===`);
            console.log(`IMEI: ${imei}, New Ignition: ${newIgnitionStatus}`);
            
            // Get latest status to compare ignition
            const latestStatus = await prisma.getClient().status.findFirst({
                where: { imei: imei.toString() },
                orderBy: { createdAt: 'desc' },
                select: { ignition: true }
            });
    
            console.log(`Latest status ignition: ${latestStatus?.ignition}`);
            console.log(`Should send notification: ${!latestStatus || latestStatus.ignition !== newIgnitionStatus}`);
    
            // If no previous status or ignition changed, send notification
            if (!latestStatus || latestStatus.ignition !== newIgnitionStatus) {
                console.log(`Sending ignition notification...`);
                const vehicle = await prisma.getClient().vehicle.findUnique({
                    where: { imei: imei.toString() },
                    select: { vehicleNo: true }
                });
    
                if (vehicle) {
                    const ignitionStatus = newIgnitionStatus ? 'On' : 'Off';
                    const title = 'Vehicle Status Update';
                    const message = `${vehicle.vehicleNo}: Ignition is ${ignitionStatus}`;
    
                    await this.sendVehicleNotification(imei, title, message, {
                        type: 'ignition_change',
                        ignitionStatus: newIgnitionStatus
                    });
                }
            } else {
                console.log(`Ignition status unchanged, skipping notification`);
            }
            console.log(`=== END IGNITION CHECK ===`);
        } catch (error) {
            console.error('Error checking ignition change:', error);
        }
    }

    // Check speed limit and send overspeeding notification
    static async checkSpeedLimitAndNotify(imei, currentSpeed) {
        try {
            console.log(`=== SPEED CHECK DEBUG ===`);
            console.log(`IMEI: ${imei}, Current Speed: ${currentSpeed}`);
            
            // Get vehicle speed limit
            const vehicle = await prisma.getClient().vehicle.findUnique({
                where: { imei: imei.toString() },
                select: { vehicleNo: true, speedLimit: true }
            });
    
            if (!vehicle) {
                console.log('Vehicle not found');
                return;
            }
    
            console.log(`Vehicle: ${vehicle.vehicleNo}, Speed Limit: ${vehicle.speedLimit}`);
            console.log(`Speed exceeds limit: ${currentSpeed > vehicle.speedLimit}`);
    
            // Check if speed exceeds limit
            if (currentSpeed > vehicle.speedLimit) {
                console.log(`Sending speed alert notification...`);
                const title = 'Speed Alert';
                const message = `${vehicle.vehicleNo}: Vehicle is Overspeeding at ${currentSpeed} km/h`;
    
                await this.sendVehicleNotification(imei, title, message, {
                    type: 'overspeeding',
                    currentSpeed: currentSpeed,
                    speedLimit: vehicle.speedLimit
                });
            } else {
                console.log(`Speed within limit, no notification needed`);
            }
            console.log(`=== END SPEED CHECK ===`);
        } catch (error) {
            console.error('Error checking speed limit:', error);
        }
    }

    // Check if vehicle is moving after ignition off and send notification
    static async checkMovingAfterIgnitionOffAndNotify(imei) {
        try {
            // Get latest status where ignition is off
            const latestIgnitionOffStatus = await prisma.getClient().status.findFirst({
                where: {
                    imei: imei.toString(),
                    ignition: false
                },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            });

            if (!latestIgnitionOffStatus) return;

            // Get latest location data
            const latestLocation = await prisma.getClient().location.findFirst({
                where: { imei: imei.toString() },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            });

            if (!latestLocation) return;

            // Compare timestamps: if ignition_off is newer than location, send notification
            if (latestIgnitionOffStatus.createdAt > latestLocation.createdAt) {
                const vehicle = await prisma.getClient().vehicle.findUnique({
                    where: { imei: imei.toString() },
                    select: { vehicleNo: true }
                });

                if (vehicle) {
                    const title = 'Vehicle Movement Alert';
                    const message = `${vehicle.vehicleNo}: Vehicle is moving`;

                    await this.sendVehicleNotification(imei, title, message, {
                        type: 'moving_after_ignition_off',
                        ignitionOffTime: latestIgnitionOffStatus.createdAt,
                        lastLocationTime: latestLocation.createdAt
                    });
                }
            }
        } catch (error) {
            console.error('Error checking moving after ignition off:', error);
        }
    }

    static async forceTestNotification(imei) {
        try {
            console.log('=== FORCE TEST NOTIFICATION ===');
            
            const vehicle = await prisma.getClient().vehicle.findUnique({
                where: { imei: imei.toString() },
                select: { id: true, vehicleNo: true }
            });
    
            if (!vehicle) {
                console.log('Vehicle not found');
                return;
            }
    
            console.log(`Sending test notification for vehicle: ${vehicle.vehicleNo}`);
            
            await this.sendVehicleNotification(imei, 'TEST NOTIFICATION', 'This is a forced test notification', {
                type: 'test',
                timestamp: new Date().toISOString()
            });
            
            console.log('Test notification sent successfully');
            
        } catch (error) {
            console.error('Force test notification error:', error);
        }
    }
}

module.exports = GT06NotificationService;