const Gt06 = require('gt06x22')


class GT06Handler {

    constructor(data) {
        var gt06 = new Gt06();

        try {
            gt06.parse(data);
        } catch (e) {
            console.log('Error while parsing gt06 data: ', e);
            return;
        }

        if (gt06.expectsResponse) {
            client.write(gt06.responseMsg);
        }

        gt06.msgBuffer.forEach(msg => {
            console.log(msg);
        });

        gt06.clearMsgBuffer();
    }

}

module.exports = {
    GT06Handler
}