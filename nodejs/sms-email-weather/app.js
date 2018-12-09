/**
The following JSON template shows what is sent as the payload:
{
    "serialNumber": "GXXXXXXXXXXXXXXXXX",
    "batteryVoltage": "xxmV",
    "clickType": "SINGLE" | "DOUBLE" | "LONG"
}
 */

'use strict';

exports.handler = (event, context, callback) => {
    console.log('Received event:', event);

    switch (event.clickType) {
        case 'SINGLE':
            sendSms(event, callback);
            break;
            
        case 'DOUBLE':
            postToIfttt(event, callback);
            break;
            
        case 'LONG':
            callLambda(event, callback);
            break;
        
        default:
            callback(`Unknown click type (${event.clickType})`);
            return;
    }
};

const sendSms = (event, callback) => {
    const AWS = require('aws-sdk');
    const SNS = new AWS.SNS();
    
    const phoneNumber = process.env.PhoneNumber;
    console.log('Sending SMS to: ', phoneNumber);
    
    const params = {
        PhoneNumber: phoneNumber,
        Message: `Hello from Iot Button! Pressed: ${event.clickType}`,
    };
    SNS.publish(params, callback);
    callback(null, 'SMS send successfully');
};

const postToIfttt = (event, callback) => {
    const https = require('https');

    const makerEvent = process.env.MakerEvent;
    const makerKey = process.env.MakerKey;
    
    console.log('Maker event:', makerEvent);
    
    var postData = JSON.stringify({
      'value1' : `Greetings from IFTTT Maker triggered by ${event.serialNumber} IoT Button`,
      'value2' : process.env.EmailAddress,
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
      callback(null, 'POST send successfully');
    });
    
    req.on('error', (e) => {
      console.error(e);
    });
    
    req.write(postData);
    req.end();
};

const callLambda = (event, callback) => {
    const AWS = require('aws-sdk');
    const lambda = new AWS.Lambda();
    
    const lambdaToCall = process.env.LambdaToInvoke;
    console.log('Calling lambda: ', lambdaToCall);
    
    event.emailAddress = process.env.EmailAddress;
    
    const params = {
        FunctionName: lambdaToCall,
        InvocationType: "Event",
        Payload: JSON.stringify(event),
    };
    
    lambda.invoke(params);
    callback(null, `Lambda invoked successfully`);
};