//
// MPPT
//

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready    = require('@serialport/parser-ready');

// this class in for monitoring Tracer 4215RN
class MPPTDataClient {
    constructor() {
        console.log('MPPTDataClient::constructor');
	this.ignorePackage = true;
	this.syncHead = [0xEB, 0x90, 0xEB, 0x90, 0xEB, 0x90];
	this.allData = [];

	this.port = new SerialPort(
	    '/dev/ttyAMA0',
	    {
		baudRate:    9600,
		dataBits:    8,
		parity:      'none',
		stopBits:    1,
		flowControl: false
		//,parser:      new Readline({ delimiter: String.fromCharCode(0x7F) })
	    });

	this.nextCmd = null;
	// fixed command for monitoring the values
	this.cmd = this.syncHead.concat([0x16, 0xA0, 0x00, 0xB1, 0xA7, 0x7F]);
	this.isPortReady = false;
	this.data = new Object();

	const readlineParser = new Readline({ delimiter: String.fromCharCode(0x7F) });
	this.port.pipe(readlineParser);
	const readyParser = new Ready({ delimiter: this.syncHead });
	this.port.pipe(readyParser);

	readyParser.on('ready', function() {
	    // react only on full package, i.e. data following syncHead
	    // this is needed if connected to bus together with a MT-5 client
	    this.ignorePackage = false;
	}.bind(this));

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

	// get back a buffer rather than a string with parser.on
	this.port.on('data', (data) => {
	    if (this.ignorePackage) return;
	    // this.ignorePackage == true ==> syncHead received

	    data.map(i => this.allData.push(i));

	    // if length <= 8, there is not yet a data length byte
	    if (this.allData.length <= 8) return;

	    const cmdIndex = 7;
	    // data length byte received, then check command
	    // only interested in 0xA0 command
	    if (this.allData[cmdIndex] != 0xA0) {
		console.log('ignorePackage set true');
		this.ignorePackage = true;
	    }
	    const dataLength = this.allData[8] + 1; // plus 1 byte for storing the length
	    const lengthIdCmd = 2; // 2 bytes for the ID and the command 0xA0
	    const CRClength = 2; 
	    const totalPackageLength = this.syncHead.length + lengthIdCmd
		  + dataLength + CRClength + 1; // plus 1 byte for stop byte 0x7F
	    if (this.allData.length >= totalPackageLength)
	    {
		if (! this.ignorePackage && this.validateCRC(this.allData)) {
		
		    this.data.batteryVoltage       = ((this.allData[10] << 8) + this.allData[9]) * 0.01;
		    this.data.PvVoltage            = ((this.allData[12] << 8) + this.allData[11]) * 0.01;
		    this.data.loadCurrent          = ((this.allData[16] << 8) + this.allData[15]) * 0.01
		    this.data.overDischargeVoltage = ((this.allData[18] << 8) + this.allData[17]) * 0.01
		    this.data.batteryFullVoltage   = ((this.allData[20] << 8) + this.allData[19]) * 0.01
		    this.data.isLoadOn             = this.allData[21] != 0
		    this.data.isOverload           = this.allData[22] != 0
		    this.data.isLoadShortCircuit   = this.allData[23] != 0
		    this.data.isBatteryOverload    = this.allData[25] != 0
		    this.data.isOverDischarge      = this.allData[26] != 0
		    this.data.isFullIndicator      = this.allData[27] != 0
		    this.data.chargingIndicator    = this.allData[28] != 0
		    this.data.batteryTemperature   = this.allData[29] - 30
		    this.data.chargingCurrent      = ((this.allData[31] << 8) + this.allData[30]) * 0.01

		    console.log('batteryVoltage: ', this.data.batteryVoltage);
		    console.log('PvVoltage: ', this.data.PvVoltage)
		    console.log('loadCurrent: ', this.data.loadCurrent)
		    console.log('overDischargeVoltage: ', this.data.overDischargeVoltage)
		    console.log('batteryFullVoltage: ', this.data.batteryFullVoltage)
		    console.log('isLoadOn: ', this.data.isLoadOn)
		    console.log('isOverload: ', this.data.isOverload)
		    console.log('isLoadShortCircuit: ', this.data.isLoadShortCircuit)
		    console.log('isBatteryOverload: ', this.data.isBatteryOverload)
		    console.log('isOverDischarge: ', this.data.isOverDischarge)
		    console.log('isFullIndicator: ', this.data.isFullIndicator)
		    console.log('chargingIndicator: ', this.data.chargingIndicator)
		    console.log('batteryTemperature: ', this.data.batteryTemperature)
		    console.log('chargingCurrent: ', this.data.chargingCurrent)
		}
		else
		    console.log("Invalid CRC");

		this.allData = [];
		this.ignorePackage = false;
	    }
	});
    }

    requestData() {
	if (! this.isPortReady ) return;
	this.port.write(this.nextCmd, function(err) {
	    if (err) {
		return console.log('ERROR on write: ', err.message)
	    }
	});
	this.nextCmd = this.cmd;
    }

    calcCRC(data, shift, crc_len) {
	let r1 = data[shift];
	let r2 = data[++shift];
	let r3 = 0;
	let r4 = 0;
	let crc_buff = ++shift;

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
	let crcH = data[data[8] + 9];
	data[data[8] + 9] = 0;
	let crcL = data[data[8] + 10];
	data[data[8] + 10] = 0;
	let crc = this.calcCRC(data, 6, data[8] + 5);
	return (crcL === (crc & 0xFF)) && (crcH === (crc >> 8));
    }

    getData() { return this.data; }
}


const client = new MPPTDataClient();
module.exports.client = client;
// If this is the only client on the serial bus then
// you need to regularly send a command 0xA0. If one
// member on the bus is the MT-5 it will do this task.
// Then comment the next command.
setInterval(client.requestData.bind(client), 2000);

