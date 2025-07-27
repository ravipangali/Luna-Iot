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

    handleData(data) {
        this.data = data.toString('hex');
        console.log(this.data);
        const usedProtcol = this.identifyer(this.data)
        console.log(usedProtcol)
    }

    identifyer(data) {
        for (const protocol of this.protocols) {
            if (protocol.start.includes(data.slice(0, 2).toString('hex'))) {
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