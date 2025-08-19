const moment = require('moment-timezone');

class DateTimeService {
    // Returns the current datetime in Nepal timezone (Asia/Kathmandu) as ISO string
    getCurrentNepalTimeISO() {
        return moment().tz('Asia/Kathmandu').toISOString();
    }
}

// Export singleton instance
module.exports = new DateTimeService();