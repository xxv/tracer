// test the Tracer 4215RN client
const MPPTclient = require('./index').MPPTDataClient;

// the MPPT client to tracer needs to be triggered by
// requesting data in intervals, if there is no MT-5
// display daisy chained on the bus. If a MT-5 is
// is connected set MPPTclient's parameter to 0 or
// leave empty:

// true: issue data requests every 2 seconds
// false or empty: use this if you have a MT-5 connected
let client = new MPPTclient(0);

// Three possible ways to request data in intervals:
//
// 1. Create a client with a interval time in milliseconds:
//    let client = new MPPTclient(5000); // to request data every 5 seconds
// 2. Create a client without internal triggering and
//    define a setInterval:
//    let client = new MPPTclient(); // to request data every 5 seconds
//    setInterval(client.requestData.bind(client), 2000);
// 3. Create a client without internal triggering and
//    define a setInterval that does some more than triggering, e.g. print:
//    let client = new MPPTclient(); // to request data every 5 seconds

setInterval(function () {
    client.requestData();
    let data  = client.getData();
    
    console.log('batteryVoltage: ', data.batteryVoltage);
    console.log('PvVoltage: ', data.PvVoltage);
    console.log('loadCurrent: ', data.loadCurrent);
    console.log('overDischargeVoltage: ', data.overDischargeVoltage);
    console.log('batteryFullVoltage: ', data.batteryFullVoltage);
    console.log('isLoadOn: ', data.isLoadOn);
    console.log('isOverload: ', data.isOverload);
    console.log('isLoadShortCircuit: ', data.isLoadShortCircuit);
    console.log('isBatteryOverload: ', data.isBatteryOverload);
    console.log('isOverDischarge: ', data.isOverDischarge);
    console.log('isFullIndicator: ', data.isFullIndicator);
    console.log('chargingIndicator: ', data.chargingIndicator);
    console.log('batteryTemperature: ', data.batteryTemperature);
    console.log('chargingCurrent: ', data.chargingCurrent);
}.bind(client), 2000); // every 2 seconds
