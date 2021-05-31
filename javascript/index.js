//
// MPPT
//

const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');

// class for monitoring Tracer 4215RN
class MPPTDataClient {
    // \param interval in milliseconds to request data
    //        leave empty or set to 0 if daisy chained with
    //        a MT-5
    constructor(interval) {
        console.log('MPPTDataClient::constructor');
	this.ignorePackage = false;
	this.syncHead = [0xEB, 0x90, 0xEB, 0x90, 0xEB, 0x90];
	this.allData = [];

	// the port settings for a tracer over GPIO on PI 
	this.port = new SerialPort(
	    '/dev/ttyAMA0',
	    {
		baudRate:    9600,
		dataBits:    8,
		parity:      'none',
		stopBits:    1,
		flowControl: false
	    });

	this.nextCmd = null;
	// fixed command for monitoring the values
	this.cmd = this.syncHead.concat([0x16, 0xA0, 0x00, 0xB1, 0xA7, 0x7F]);
	this.isPortReady = false;
	this.data = new Object();

	const delimiterParser  = new Delimiter({ delimiter: this.syncHead });
	this.port.pipe(delimiterParser);

	this.port.on('open', function() {
	    const pwlStartup = [0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55];
	    this.nextCmd = pwlStartup.concat(this.cmd);
	    this.isPortReady = true;
	}.bind(this));

	this.port.on('error', function(err) {
	    console.log('ERROR: ', err)
	})
	
	this.port.on('close', function() {
	    console.log("Port closed");
	    this.isPortReady = false;
	});

	// using the parser's on get data without the delimiter
	delimiterParser.on('data', (data) => {
	    if (this.ignorePackage) return;

	    data.map(i => this.allData.push(i));

	    // if length <= 8, there is not yet a data length byte
	    if (this.allData.length <= 2) return;

	    const cmdIndex = 1;
	    // data length byte received, then check command
	    // only interested in 0xA0 command
	    if (this.allData[cmdIndex] != 0xA0) {
		console.log('ignorePackage set true');
		this.ignorePackage = true;
	    }
	    const dataLength = this.allData[2] + 1; // plus 1 byte for storing the length
	    const lengthIdCmd = 2; // 2 bytes for the ID and the command 0xA0
	    const CRClength = 2; 
	    const totalPackageLength = lengthIdCmd
		  + dataLength + CRClength + 1; // plus 1 byte for stop byte 0x7F
	    if (this.allData.length >= totalPackageLength)
	    {
		if (! this.ignorePackage) {
		    if (this.validateCRC(this.allData)) {
			this.data.batteryVoltage       = ((this.allData[4] << 8) + this.allData[3]) * 0.01;
			this.data.PvVoltage            = ((this.allData[6] << 8) + this.allData[5]) * 0.01;
			this.data.loadCurrent          = ((this.allData[10] << 8) + this.allData[9]) * 0.01;
			this.data.overDischargeVoltage = ((this.allData[12] << 8) + this.allData[11]) * 0.01;
			this.data.batteryFullVoltage   = ((this.allData[14] << 8) + this.allData[13]) * 0.01;
			this.data.isLoadOn             = this.allData[15] != 0;
			this.data.isOverload           = this.allData[16] != 0;
			this.data.isLoadShortCircuit   = this.allData[17] != 0;
			this.data.isBatteryOverload    = this.allData[19] != 0;
			this.data.isOverDischarge      = this.allData[20] != 0;
			this.data.isFullIndicator      = this.allData[21] != 0;
			this.data.chargingIndicator    = this.allData[22] != 0;
			this.data.batteryTemperature   = this.allData[23] - 30;
			this.data.chargingCurrent      = ((this.allData[25] << 8) + this.allData[24]) * 0.01;
		    }
		    else
			console.log("WARNING: Invalid CRC");
		}
		this.allData = [];
		this.ignorePackage = false;
	    }
	});

	if(! MPPTDataClient.instance){
            MPPTDataClient.instance = this;
            // FIXME: object freeze does not work as it should
            Object.freeze(MPPTDataClient);
	    if (interval && interval > 0) setInterval(this.requestData.bind(this), interval);
        }
        return MPPTDataClient.instance;
    }

    requestData() {
	if (! this.isPortReady ) return;
	this.port.write(this.nextCmd, function(err) {
	    if (err) {
		console.log('ERROR on write: ', err.message);
	    }
	});
	this.nextCmd = this.cmd;
    }

    calcCRC(data, crc_len) {
	let r1 = data[0];
	let r2 = data[1];
	let r3 = 0;
	let r4 = 0;
	let crc_buff = 2;

	for (let i = 0; i < crc_len - 2; ++i) {
            r3 = data[crc_buff++];
            for (let j = 0; j < 8; ++j) {
		r4 = r1;
		r1 = (r1 << 1) & 0xFF;

		if (r2 & 0x80) ++r1;
		r2 = (r2 << 1) & 0xFF;

		if (r3 & 0x80) ++r2;
		r3 = (r3 << 1) & 0xFF;

		if (r4 & 0x80) {
                    r1 ^= 0x10;
                    r2 ^= 0x41;
		}
	    }
	}
	return ((r1 << 8) | r2)
    }

    validateCRC(data) {
	// the input CRC bytes must be zeroed
	const dataLength = data[2];
	let crcH = data[dataLength + 3];
	data[dataLength + 3] = 0;
	let crcL = data[dataLength + 4];
	data[dataLength + 4] = 0;
	let crc = this.calcCRC(data, dataLength + 5);
	return (crcL === (crc & 0xFF)) && (crcH === (crc >> 8));
    }

    getData() { return this.data; }
}

module.exports.MPPTDataClient = MPPTDataClient;

// see test.js for usage

