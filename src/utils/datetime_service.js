const moment = require('moment-timezone');

class DateTimeService {
    constructor() {
        this.nepalTimezone = 'Asia/Kathmandu';
    }

    /**
     * Convert device timestamp to Nepal timezone and return as Date object
     * This ensures the Nepal timezone is preserved when saving to database
     * @param {string|number} deviceTime - Device fixTime or fixTimestamp
     * @returns {Date} Date object in Nepal timezone
     */
    convertDeviceTimeToNepal(deviceTime) {
        try {
            let momentObj;
            
            if (typeof deviceTime === 'string') {
                // Device fixTime (ISO string) - treat as UTC
                momentObj = moment.utc(deviceTime);
            } else if (typeof deviceTime === 'number') {
                // Device fixTimestamp (Unix timestamp in seconds)
                momentObj = moment.unix(deviceTime);
            } else {
                throw new Error('Invalid device time format');
            }

            // Convert to Nepal timezone
            const nepalMoment = momentObj.tz(this.nepalTimezone);
            
            // Create a new Date object with the Nepal time components
            const nepalDate = new Date();
            nepalDate.setFullYear(nepalMoment.year());
            nepalDate.setMonth(nepalMoment.month());
            nepalDate.setDate(nepalMoment.date());
            nepalDate.setHours(nepalMoment.hour());
            nepalDate.setMinutes(nepalMoment.minute());
            nepalDate.setSeconds(nepalMoment.second());
            nepalDate.setMilliseconds(nepalMoment.millisecond());
            
            return nepalDate;
        } catch (error) {
            console.error('Error converting device time to Nepal time:', error);
            // Return current Nepal time as fallback
            return this.getCurrentNepalTime();
        }
    }

    /**
     * Get current Nepal time as Date object
     * @returns {Date} Current time in Nepal timezone
     */
    getCurrentNepalTime() {
        const nepalMoment = moment().tz(this.nepalTimezone);
        
        // Create a new Date object with the Nepal time components
        const nepalDate = new Date();
        nepalDate.setFullYear(nepalMoment.year());
        nepalDate.setMonth(nepalMoment.month());
        nepalDate.setDate(nepalMoment.date());
        nepalDate.setHours(nepalMoment.hour());
        nepalDate.setMinutes(nepalMoment.minute());
        nepalDate.setSeconds(nepalMoment.second());
        nepalDate.setMilliseconds(nepalMoment.millisecond());
        
        return nepalDate;
    }

    /**
     * Format Nepal time to readable string for debugging
     * @param {Date} date - Date object
     * @returns {string} Formatted string in Nepal timezone
     */
    formatNepalTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
        return moment(date).tz(this.nepalTimezone).format(format);
    }

    /**
     * Get current Nepal time as formatted string for debugging
     * @returns {string} Current Nepal time as formatted string
     */
    getCurrentNepalTimeString() {
        return moment().tz(this.nepalTimezone).format('YYYY-MM-DD HH:mm:ss');
    }
}

module.exports = new DateTimeService();