const moment = require('moment-timezone');

class DateTimeService {
    constructor() {
        this.nepalTimezone = 'Asia/Kathmandu';
    }

    /**
     * Convert any timestamp to Nepal timezone and return as ISO string
     * This ensures the Nepal time is preserved when saving to database
     * @param {Date|string|number} timestamp - Input timestamp (Date object, ISO string, or Unix timestamp)
     * @returns {string} ISO string in Nepal timezone
     */
    toNepalTimeISO(timestamp) {
        try {
            let momentObj;
            
            if (timestamp instanceof Date) {
                // If it's already a Date object
                momentObj = moment(timestamp);
            } else if (typeof timestamp === 'string') {
                // If it's an ISO string
                momentObj = moment(timestamp);
            } else if (typeof timestamp === 'number') {
                // If it's a Unix timestamp (seconds or milliseconds)
                if (timestamp < 1000000000000) {
                    // Unix timestamp in seconds, convert to milliseconds
                    momentObj = moment.unix(timestamp);
                } else {
                    // Unix timestamp in milliseconds
                    momentObj = moment(timestamp);
                }
            } else {
                throw new Error('Invalid timestamp format');
            }

            // Convert to Nepal timezone and return as ISO string
            const nepalTime = momentObj.tz(this.nepalTimezone);
            return nepalTime.toISOString();
        } catch (error) {
            console.error('Error converting to Nepal time:', error);
            // Return current Nepal time as fallback
            return moment().tz(this.nepalTimezone).toISOString();
        }
    }

    /**
     * Convert any timestamp to Nepal timezone as Date object
     * @param {Date|string|number} timestamp - Input timestamp
     * @returns {Date} Date object in Nepal timezone
     */
    toNepalTime(timestamp) {
        try {
            let momentObj;
            
            if (timestamp instanceof Date) {
                momentObj = moment(timestamp);
            } else if (typeof timestamp === 'string') {
                momentObj = moment(timestamp);
            } else if (typeof timestamp === 'number') {
                if (timestamp < 1000000000000) {
                    momentObj = moment.unix(timestamp);
                } else {
                    momentObj = moment(timestamp);
                }
            } else {
                throw new Error('Invalid timestamp format');
            }

            const nepalTime = momentObj.tz(this.nepalTimezone);
            return nepalTime.toDate();
        } catch (error) {
            console.error('Error converting to Nepal time:', error);
            return moment().tz(this.nepalTimezone).toDate();
        }
    }

    /**
     * Get current Nepal time as ISO string
     * @returns {string} Current time in Nepal timezone as ISO string
     */
    getCurrentNepalTimeISO() {
        return moment().tz(this.nepalTimezone).toISOString();
    }

    /**
     * Get current Nepal time as Date object
     * @returns {Date} Current time in Nepal timezone
     */
    getCurrentNepalTime() {
        return moment().tz(this.nepalTimezone).toDate();
    }

    /**
     * Format timestamp to Nepal timezone string
     * @param {Date|string|number} timestamp - Input timestamp
     * @param {string} format - Output format (default: 'YYYY-MM-DD HH:mm:ss')
     * @returns {string} Formatted string in Nepal timezone
     */
    formatNepalTime(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
        try {
            const nepalTime = this.toNepalTime(timestamp);
            return moment(nepalTime).tz(this.nepalTimezone).format(format);
        } catch (error) {
            console.error('Error formatting Nepal time:', error);
            return moment().tz(this.nepalTimezone).format(format);
        }
    }

    /**
     * Parse Nepal time string and convert to UTC for database storage
     * @param {string} nepalTimeString - Time string in Nepal timezone
     * @returns {Date} UTC Date object for database storage
     */
    nepalTimeStringToUTC(nepalTimeString) {
        try {
            const nepalMoment = moment.tz(nepalTimeString, this.nepalTimezone);
            return nepalMoment.utc().toDate();
        } catch (error) {
            console.error('Error converting Nepal time string to UTC:', error);
            return new Date();
        }
    }

    /**
     * Get timezone offset for Nepal
     * @returns {number} Offset in minutes
     */
    getNepalTimezoneOffset() {
        return moment.tz(this.nepalTimezone).utcOffset();
    }

    /**
     * Check if a timestamp is valid
     * @param {any} timestamp - Input timestamp
     * @returns {boolean} True if valid timestamp
     */
    isValidTimestamp(timestamp) {
        try {
            if (timestamp instanceof Date) {
                return !isNaN(timestamp.getTime());
            } else if (typeof timestamp === 'string') {
                return moment(timestamp).isValid();
            } else if (typeof timestamp === 'number') {
                return moment.unix(timestamp).isValid();
            }
            return false;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
module.exports = new DateTimeService();