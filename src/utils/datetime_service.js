const moment = require('moment-timezone');

class DateTimeService {
    constructor() {
        this.nepalTimezone = 'Asia/Kathmandu';
    }

    /**
     * Convert device timestamp to Nepal timezone
     * @param {string|number} deviceTime - Device fixTime or fixTimestamp
     * @returns {Date} Date object in Nepal timezone
     */
    convertDeviceTimeToNepal(deviceTime) {
        try {
            let momentObj;
            
            if (typeof deviceTime === 'string') {
                // Device fixTime (ISO string)
                momentObj = moment(deviceTime);
            } else if (typeof deviceTime === 'number') {
                // Device fixTimestamp (Unix timestamp in seconds)
                momentObj = moment.unix(deviceTime);
            } else {
                throw new Error('Invalid device time format');
            }

            // Convert to Nepal timezone and return as Date object
            const nepalTime = momentObj.tz(this.nepalTimezone);
            return nepalTime.toDate();
        } catch (error) {
            console.error('Error converting device time to Nepal time:', error);
            // Return current Nepal time as fallback
            return moment().tz(this.nepalTimezone).toDate();
        }
    }

    /**
     * Get current Nepal time as Date object
     * @returns {Date} Current time in Nepal timezone
     */
    getCurrentNepalTime() {
        return moment().tz(this.nepalTimezone).toDate();
    }

    /**
     * Format Nepal time to readable string
     * @param {Date} date - Date object
     * @returns {string} Formatted string in Nepal timezone
     */
    formatNepalTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
        return moment(date).tz(this.nepalTimezone).format(format);
    }
}

module.exports = new DateTimeService();