const prisma = require('../prisma');

class UserModel {
    async createUser(data) {
        try {
            return await prisma.getClient().user.create({
                data,
                include: {
                    role: true
                }
            });
        } catch (error) {
            console.error('USER CREATION ERROR', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            return await prisma.getClient().user.findMany({
                include: {
                    role: true
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING USERS', error);
            throw error;
        }
    }

    async getUserByPhone(phone) {
        try {
            return await prisma.getClient().user.findUnique({
                where: { phone },
                include: {
                    role: true
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING USER BY PHONE', error);
            throw error;
        }
    }

    async getUserById(id) {
        try {
            return await prisma.getClient().user.findUnique({
                where: { id: parseInt(id) },
                include: {
                    role: true
                }
            });
        } catch (error) {
            console.error('ERROR FETCHING USER BY ID', error);
            throw error;
        }
    }

    async updateUser(phone, data) {
        try {
            return await prisma.getClient().user.update({
                where: { phone },
                data,
                include: {
                    role: true
                }
            });
        } catch (error) {
            console.error('ERROR UPDATING USER', error);
            throw error;
        }
    }

    async deleteUser(phone) {
        try {
            return await prisma.getClient().user.delete({
                where: { phone }
            });
        } catch (error) {
            console.error('ERROR DELETING USER', error);
            throw error;
        }
    }
}

module.exports = UserModel;