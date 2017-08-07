
const logTranscript = function(data, record) {
  console.log(data)
  if (data.results[0] && data.results[0].alternatives[0]) {
    process.stdout.write(`Transcript: ${data.results[0].alternatives[0].transcript}\n`)
  }
  else {
    record.stop();
    start();
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
  middleware: [logTranscript],
  request: { // Configuration for a request sent to StreamingRecognize
    config: {
      encoding: 'LINEAR16',
      languageCode: 'en-US',
      sampleRateHertz: 16000,
    },
    interimResults: false // If you want interim results, set this to true
  }
}

console.log('Configured with:', options)
const listen = function(options) {
  const record = require('node-record-lpcm16');

  // Imports the Google Cloud client library
  const Speech = require('@google-cloud/speech');

  // Instantiates a client
  const speech = Speech();

  // Create a recognize stream
  const recognizeStreamCreate = function() {
    return speech.streamingRecognize(options.request)
      .on('error', (err) => {
        // console.error(err);
        // console.log("\n\nDisregarding error and restarting stream...\n\n")
      })
      .on('data', (data, record) => {
        options.middleware.forEach(f => f(data, record))
      });
  }

  // Start recording and send the microphone input to the Speech API
  const start = function() {
    record
      .start(options)
      .on('error', console.error)
      .pipe(recognizeStreamCreate())
      .on('finish', start);
    console.log('Listening... (Ctrl+C to stop)');
  }

  start(); 
}

// Run it!
listen(options);
