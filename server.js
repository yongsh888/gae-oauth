// This is a sample app to demo CPF OAuth Authentication Test - Identity Platform (Google OAuth) - App Engine (Node.JS)
// Author: Shao-Horng Yong (yongsh@google.com)
// v1.0
const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const {google} = require('googleapis');

const app = express();

// Serve static index.html file as home page.
// User flow step 1: The index.html will simulate a normal user workflow where an internet first visit the home page.
app.use(express.static('public'));

// This is not used as redirected to public/index.html
app.get('/', (req, res) => {
    res.send('Hello from App Engine!');
});

// OAuth codes from
// - https://developers.google.com/identity/protocols/oauth2/web-server#node.js
// - https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation
const oauth2Client = new google.auth.OAuth2(
    '470358255036-830hte0f9jscco7l6aa954r70339ipmt.apps.googleusercontent.com',
    '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',
    'https://crack-map-382203.uc.r.appspot.com/oauth2callback'
  );
  
// generate a url that asks permissions for Blogger and Google Calendar scopes
const scopes = [
//'https://www.googleapis.com/auth/blogger',
//'https://www.googleapis.com/auth/calendar',
'https://www.googleapis.com/auth/drive.metadata.readonly'
];

const authorizationUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    //access_type: 'online',

    // If you only need one scope you can pass it as a string
    scope: scopes,

    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true
});

// User flow step 2: This is a step to simulate public user clicking on Login button.
// It's also a debug step to display authorized URL.
app.get('/consent', (req, res) => {
    console.log('***Consent\n');
    // Not sure why the redirection doesn't happen. Revert back to clicking
    //console.log({ "Location": authorizationUrl });
    //res.writeHead(301, { "Location": authorizationUrl });
    res.write('This is the generated authorized URL (click to log in): <a href="' + authorizationUrl + '">' + authorizationUrl + '</a>');
    res.end();
});

let userCredential = null;

// User flow step 3: Callback after login successfully
app.get('/oauth2callback', (req, res) => {
    // Handle the OAuth 2.0 server response
    let q = url.parse(req.url, true).query;
    console.log('***Query\n');
    console.log(q);

    processToken(q.code).then(tokens =>{
        console.log('***Tokens\n');
        console.log(tokens);
        oauth2Client.setCredentials(tokens);
        // test for drive api, async method
        callDriveAPI(res).then(
        () => {
            console.log('***Drive call succ!\n');
        }
        )
    });
});

async function processToken(code){
    let { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

async function callDriveAPI(res) {
  // Example of using Google Drive API to list filenames in user's Drive.
    const drive = google.drive('v3');
    drive.files.list({
        auth: oauth2Client,
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    }, (err1, res1) => {
        if (err1) return console.log('The API returned an error: ' + err1);
        const files = res1.data.files;
        if (files.length) {
            console.log('Files:');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
                res.write(`${file.name}`+'<br/>');
            });
            res.end();
        } else {
            console.log('No files found.');
        }
    });
}

// For invalid routes
app.get('*', (req, res) => {
    console.log('404! This is an invalid URL.');
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
