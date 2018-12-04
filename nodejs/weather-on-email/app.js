/**
 The following JSON template shows what is sent as the payload:
{
    "serialNumber": "GXXXXXXXXXXXXXXXXX",
    "batteryVoltage": "xxmV",
    "clickType": "SINGLE" | "DOUBLE" | "LONG"
}
 */

'use strict';

const http = require('http');
const Stream = require('stream').Transform;

const AWS = require('aws-sdk');
const SES = new AWS.SES();

const FROM_ADDRESS = 'no-reply@sns.amazonaws.com';
const TO_ADDRESS = 'o1577829@nwytg.net';

exports.handler = (event, context, callback) => {
    console.log('Received event:', event);

    getWeather((error, weatherData) => {
        if (error) {
            callback(error);
        }

        const emailDefinition = {
            fromName: 'IoT Button',
            fromAddress: FROM_ADDRESS,
            toAddress: TO_ADDRESS,
            subject: 'Weather from IoT Button',
            body: `Weather attached.<br><br>Button: <b>${event.serialNumber}</b><br>Clicked: <b>${event.clickType}</b>`,
            attachmentName: 'weather.png',
        };
        const rawEmail = getRawEmail(emailDefinition, weatherData);

        const params = {
            RawMessage: { Data: rawEmail }
        };
        console.log('Going to send email to:', emailDefinition.toAddress);
        SES.sendRawEmail(params, function (err, data) {
            if (err) {
                console.error(err, err.stack);
                callback(err);
            }

            console.log('Email sent successfully. Data:', data);
            callback(null, "Email sent successfully");
        });
    });
};

const getWeather = (callback) => {
    const url = 'http://www.meteo.pl/um/metco/mgram_pict.php?ntype=0u&row=436&col=181&lang=en';
    console.log('Going to capture weather');
    http.get(url, (res) => {
        var data = new Stream();
        console.log(`STATUS: ${res.statusCode}`);
        res.on('data', (chunk) => {
            data.push(chunk);
        });
        res.on('end', () => {
            console.log('Weather captured successfully');
            callback(null, data.read());
        });
    }).on('error', (e) => {
        callback(`Failed to capture weather: ${e.message}`);
    });
};

const getRawEmail = (email, attachmentData) => {
    var sesMail = `From: ${email.fromName} <${email.fromAddress}>\n`;
    sesMail += `To: ${email.toAddress}\n`;
    sesMail += `Subject: ${email.subject}\n`;
    sesMail += "MIME-Version: 1.0\n";
    sesMail += "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n";
    sesMail += "--NextPart\n";
    sesMail += "Content-Type: text/html\n\n";
    sesMail += `${email.body}\n\n`;
    sesMail += "--NextPart\n";
    sesMail += `Content-Type: application/octet-stream; name=\"${email.attachmentName}\"\n`;
    sesMail += "Content-Transfer-Encoding: base64\n";
    sesMail += "Content-Disposition: attachment\n\n";
    sesMail += attachmentData.toString("base64").replace(/([^\0]{76})/g, "$1\n") + "\n\n";
    sesMail += "--NextPart--";
    return sesMail;
};