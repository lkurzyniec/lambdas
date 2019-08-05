// NOT working

const awsIot = require('aws-iot-device-sdk');

const AWS = require('aws-sdk');
const SES = new AWS.SES();

const theThingId = process.env.TheThingId;
const FROM_ADDRESS = process.env.FromAddress;
const TO_ADDRESS = process.env.ToAddress;
const CERT_ID = process.env.CertId;
const HOST = process.env.Host;

var counter;
var clientTokenUpdate;

const thingShadows = awsIot.thingShadow({
    keyPath: `/var/task/${CERT_ID}-private.pem.key`,
    certPath: `/var/task/${CERT_ID}-certificate.pem.crt`,
    caPath: '/var/task/AmazonRootCA1.pem',
    clientId: theThingId,
    host: HOST
});

const printJson = obj => JSON.stringify(obj, null, 1) + '\n-----------------------------------';

console.log('Started lambda');

thingShadows.on('connect', function () {
    console.log('connecting...');
    thingShadows.register(theThingId, {}, function () {
        console.log('connected');
        clientTokenUpdate = thingShadows.get(theThingId);
    });
});

thingShadows.on('status', function (thingName, stat, clientToken, stateObject) {
    console.log('received ' + stat + ' on ' + thingName + ': \n' + printJson(stateObject));
    counter = stateObject.state.boltCount;
});

thingShadows.on('delta', function (thingName, stateObject) {
    console.log('received delta on ' + thingName + ': \n' + printJson(stateObject));
    if (stateObject.state.boltCount === counter) {
        sendEmail(stateObject);
        console.log('message sent');
    } else {
        console.log('invalid counter value');
    }
});

exports.handler = async (event) => {
    
    var action = { "state": { "desired": { boltCount: counter++ } } };
    clientTokenUpdate = thingShadows.update(theThingId, action);
    
    const response = {
        statusCode: 204,
        body: JSON.stringify('message pushed!'),
    };
    return response;
};

const sendEmail = (stateObject) => {
    var params = {
      Destination: {
        ToAddresses: [
          TO_ADDRESS,
        ]
      },
      Message: {
        Body: {
          Html: {
           Data: `State: <b>${stateObject.state.locked}</b><br>Counter: <b>${stateObject.state.boltCount}</b>`
          }
         },
         Subject: {
          Data: 'Message from IoT ' + theThingId
         }
        },
      Source: FROM_ADDRESS,
    };
    
    var send = SES.sendEmail(params).then(
      function(data) {
        console.log(data.MessageId);
      }).catch(
        function(err) {
        console.error(err, err.stack);
      });
    return send;
};