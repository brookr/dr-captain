const listen = function() {
  const record = require('node-record-lpcm16');

  // Imports the Google Cloud client library
  const Speech = require('@google-cloud/speech');

  // Instantiates a client
  const speech = Speech();

  // The encoding of the audio file, e.g. 'LINEAR16'
  const encoding = 'LINEAR16';

  // The sample rate of the audio file in hertz, e.g. 16000
  const sampleRateHertz = 16000;

  // The BCP-47 language code to use, e.g. 'en-US'
  const languageCode = 'en-US';

  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode
    },
    interimResults: false // If you want interim results, set this to true
  };

  // Create a recognize stream
  const recognizeStreamCreate = function() {
    return speech.streamingRecognize(request)
      .on('error', (err) => {
        console.error(err);
        console.log("\n\nDisregarding error and restarting stream...\n\n")
      })
      .on('data', (data) => {
          if (data.results[0] && data.results[0].alternatives[0]) {
            process.stdout.write(`Transcription: ${data.results[0].alternatives[0].transcript}\n`)
          }
          else {
            record.stop();
            start();
          }
      });
  }

  const options = {
    sampleRateHertz: sampleRateHertz,
    threshold: 0,
    // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
    verbose: false,
    recordProgram: 'rec', // Try also "arecord" or "sox"
    silence: '1.0',
    threshold: '0.01'
  }

  // Start recording and send the microphone input to the Speech API
  const start = function() {
    record
      .start(options)
      .on('error', console.error)
      .pipe(recognizeStreamCreate())
      .on('finish', start);
    console.log('Listening, press Ctrl+C to stop.');
  }

  start(); 
}

listen();