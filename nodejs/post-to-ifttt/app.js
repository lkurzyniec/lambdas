/**
The following JSON template shows what is sent as the payload:
{
    "serialNumber": "GXXXXXXXXXXXXXXXXX",
    "batteryVoltage": "xxmV",
    "clickType": "SINGLE" | "DOUBLE" | "LONG"
}
 */

'use strict';

const https = require('https');

const makerEvent = process.env.MakerEvent;
const makerKey = process.env.MakerKey;

exports.handler = (event, context, callback) => {
    console.log('Received event:', event);

    var postData = JSON.stringify({
      'value1' : 'Hello IoT world',
      'value2' : `Greetings from IFTTT Maker triggered by ${event.serialNumber} IoT Button`,
      'value3' : event.clickType,
    });
    
    console.log('Data to post:', postData);

    const options = {
      protocol: 'https:',
      hostname: 'maker.ifttt.com',
      port: 443,
      path: `/trigger/${makerEvent}/with/key/${makerKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    let result;
    const req = https.request(options, (res) => {
      console.log('STATUS CODE:', res.statusCode);
    
      res.setEncoding('utf8');
      res.on('data', (data) => {
        result = data;
        console.log('Data recived:', result);
      });
      
      if (res.statusCode != 200) {
        callback('Failed');
        return;
      }
      callback(null, 'Success');
    });
    
    req.on('error', (e) => {
      console.error(e);
    });
    
    req.write(postData);
    req.end();
};
