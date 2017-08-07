// Configure recording
const logTranscript = function (data, record) {
  if (data.results[0] && data.results[0].alternatives[0]) {
    console.log(`Transcript: ${data.results[0].alternatives[0].transcript}\n`)
  }
  else {
    record && record.stop();
  }
};

const options = {
  docName: process.argv[2],
  encoding: 'LINEAR16', // The encoding of the audio file, e.g. 'LINEAR16'
  languageCode: 'en-US', // The BCP-47 language code to use, e.g. 'en-US'
  sampleRateHertz: 16000, // The sample rate of the audio file in hertz, e.g. 16000
  // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
  verbose: false,
  recordProgram: 'rec', // Try also "arecord" or "sox"
  silence: '0.5',
  threshold: process.argv[3] || '0.01',
  middleware: [],
  request: { // Configuration for a request sent to StreamingRecognize
    config: {
      encoding: 'LINEAR16',
      languageCode: 'en-US',
      sampleRateHertz: 16000,
    },
    interimResults: false // If you want interim results, set this to true
  }
}

options.middleware.push(logTranscript);

// console.log('Configured with:', options)

// Configure Google, and create file to write to
const google = require('googleapis');
var key = require('./service-account-key.json');
var jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.apps.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.scripts'
  ], // an array of auth scopes
  null
);
google.options({
  auth: jwtClient
});

const drive = google.drive({ version: 'v3'});
const sheets = google.sheets('v4');
const transcriptFile = {};
sheets.spreadsheets.create({
  resource: {
    properties: {
      title: process.argv[2],
    }
  },
  media: {
    mimeType: 'text/csv',
    body: 'Time, Transcript'
  },
  fields: '*'
}, function(err, file) {
  if (err) {
    console.log(err, "\nFile id:", transcriptFile.id);
  } else {
    console.log('File at:', file);
    transcriptFile.id = file.spreadsheetId;

    drive.permissions.create({
      resource: {
        'type': 'anyone',
        'role': 'writer',
      },
      fileId: file.spreadsheetId,
    })
  }
});

const writeToDrive = function(data, record) {
  if (data.results[0] && data.results[0].alternatives[0]) {
    var values = [
      [
        new Date().toJSON(),
        data.results[0].alternatives[0].transcript
      ],
    ];

    sheets.spreadsheets.values.append({
      spreadsheetId: transcriptFile.id,
      valueInputOption: 'USER_ENTERED',
      range: 'A1',
      resource: {
        values: values
      }
    }, function (err, result) {
      if (err) {
        console.log(err, "\nFile id:", transcriptFile.id);
      } else {
        // console.log('%d cells appended.', result.updates.updatedCells);
      }
    });  }
  else {
    record && record.stop();
  }
};

options.middleware.push(writeToDrive);

const record = require('node-record-lpcm16');

// Imports the Google Cloud client library
const Speech = require('@google-cloud/speech');

// Instantiates a client
const speech = Speech();

// Create a recognize stream
const recognizeStreamCreate = function () {
  return speech.streamingRecognize(options.request)
    .on('error', (err) => {
      console.error(err);
      console.log("\n\nDisregarding error and restarting stream...\n\n")
    })
    .on('data', (data, record) => {
      options.middleware.forEach(f => f(data, record))
    });
}

const listen = function(options) {
  // Start recording and send the microphone input to the Speech API
  record
    .start(options)
    .on('error', console.error)
    .pipe(recognizeStreamCreate())
    .on('end', listen);
  console.log('Listening... (Ctrl+C to stop)');
}

// Run it!
listen(options);
