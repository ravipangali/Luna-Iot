const prisma = require('../prisma');

class OtpModel {
    async createOTP(phone, otp) {
        try {
            // Delete any existing OTP for this phone
            await prisma.getClient().otp.deleteMany({
                where: { phone }
            });

            // Create new OTP
            const otpRecord = await prisma.getClient().otp.create({
                data: {
                    phone,
                    otp,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                    createdAt: new Date()
                }
            });

            return otpRecord;
        } catch (error) {
            console.error('OTP CREATION ERROR', error);
            throw error;
        }
    }

    async verifyOTP(phone, otp) {
        try {
            // Ensure OTP is treated as string for comparison
            const otpString = String(otp).trim();
            
            const otpRecord = await prisma.getClient().otp.findFirst({
                where: {
                    phone: phone.trim(),
                    otp: otpString,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });
    
    
            return otpRecord;
        } catch (error) {
            console.error('OTP VERIFICATION ERROR', error);
            // Return more specific error information
            throw new Error(`OTP verification failed: ${error.message}`);
        }
    }

    async deleteOTP(phone) {
        try {
            await prisma.getClient().otp.deleteMany({
                where: { phone }
            });
        } catch (error) {
            console.error('OTP DELETE ERROR', error);
            throw error;
        }
    }

    async cleanupExpiredOTPs() {
        try {
            const result = await prisma.getClient().otp.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });
            return result.count;
        } catch (error) {
            console.error('OTP CLEANUP ERROR', error);
            throw error;
        }
    }
    
}

module.exports = OtpModel;