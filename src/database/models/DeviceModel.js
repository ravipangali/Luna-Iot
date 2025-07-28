const prisma = require('../prisma')

class DeviceModel {

    // Create new device
    async createData(data) {
        try {
            const device = await prisma.getClient().device.upsert({
                where: { imei: data.imei.toString() },
                update: {
                    imei: data.imei.toString(),
                    phone: data.phone,
                    sim: data.sim,
                    protocol: data.protocol,
                    iccid: data.iccid,
                    model: data.model,
                    updatedAt: new Date()
                },
                create: {
                    imei: data.imei.toString(),
                    phone: data.phone,
                    sim: data.sim,
                    protocol: data.protocol,
                    iccid: data.iccid,
                    model: data.model,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
            });
            return device;
        } catch (error) {
            console.error('DEVICE CREATION ERROR', error);
            throw error;
        }
    }

    // Get all devices
    async getAllData() {
        try {
            return await prisma.getClient().device.findMany();
        } catch (error) {
            console.error('ERROR FETCHING ALL DEVICES: ',error);
            throw error;
        }
    }

    // Get device by imei
    async getDataByImei(imei) {
        imei = imei.toString();
        try {
            const device = await prisma.getClient().device.findUnique({where: {imei}});
            return device;
        } catch (error) {
            console.error('DEVICE FETCH ERROR', error);
            throw error;
        }
    }

    // Get device by id
    async getDataById(id) {
        try {
            const device = await prisma.getClient().device.findUnique({where: {id}});
            return device;
        } catch (error) {
            console.error('DEVICE FETCH ERROR', error);
            throw error;
        }
    }
    

    // Update device
    async updateData(imei, data) {
        imei = imei.toString();
        try {
            const allowedFields = ['imei', 'phone', 'sim', 'protocol', 'iccid', 'model'];
            const updateData = {};

            for (const [key, value] of Object.entries(data)) {
                if (allowedFields.includes(key)) {
                    updateData[key] = value;
                }
            }

            if (Object.keys(updateData).length === 0) {
                return null
            }

            return await prisma.getClient().device.update({
                where: {imei},
                data: updateData
            });
        } catch (error) {
            console.error('ERROR UPDATE DEVICE: ',error);
            throw error;
        }
    }

    // Delete device
    async deleteData(imei) {
        imei = imei.toString();
        try {
            const result = await prisma.getClient().device.delete({where: {imei}});
            return result;
        } catch (error) {
            console.error('ERROR DELETE DEVICE: ',error);
            throw error;
        }
    }
}

module.exports = DeviceModel