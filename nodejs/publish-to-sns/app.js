/**
The following JSON template shows what is sent as the payload:
{
    "serialNumber": "GXXXXXXXXXXXXXXXXX",
    "batteryVoltage": "xxmV",
    "clickType": "SINGLE" | "DOUBLE" | "LONG"
}
 */

'use strict';

const AWS = require('aws-sdk');

const SNS = new AWS.SNS();
const TOPIC_ARN = process.env.TopicArn;

exports.handler = (event, context, callback) => {
    console.log('Received event:', event);

    const params = {
        Message: `Pressed: ${event.clickType}`,
        Subject: `Greetings from IoT Button`,
        TopicArn: TOPIC_ARN,
    };
    SNS.publish(params, callback);
};
