const gt06_handler = require('./gt06_handler')

class DataHandler {

    constructor() {
        this.data = null;
        this.protocols = [
            {
                name: 'gt06',
                start: ['7878', '7979'],
                end: ['0D0A'],
            },
        ]
    }

    handleData(data, socket) {
        this.data = data
        const hexData = data.toString('hex');
        const usedProtcol = this.identifyer(hexData)

        if (usedProtcol === 'gt06' || usedProtcol === null) {
            new gt06_handler.GT06Handler(this.data, socket);
        }
        
    }

    identifyer(data) {
        for (const protocol of this.protocols) {
            if (data.startsWith(protocol.start[0]) || data.startsWith(protocol.start[1])) {
                return protocol.name;
            }
        }
        return null;
    }

    clearData() {
        this.data = null;
    }

}

module.exports = {
    DataHandler
}