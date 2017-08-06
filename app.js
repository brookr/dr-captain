const options = {
  docName: process.argv[2],
  encoding: 'LINEAR16', // The encoding of the audio file, e.g. 'LINEAR16'
  languageCode: 'en-US', // The BCP-47 language code to use, e.g. 'en-US'
  sampleRateHertz: 16000, // The sample rate of the audio file in hertz, e.g. 16000
  // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
  verbose: false,
  recordProgram: 'rec', // Try also "arecord" or "sox"
  silence: '1.0',
  threshold: process.argv[3] || '0.01'
}

const listen = function(options) {
  const record = require('node-record-lpcm16');

  // Imports the Google Cloud client library
  const Speech = require('@google-cloud/speech');

  // Instantiates a client
  const speech = Speech();

  const request = {
    config: {
      encoding: options.encoding,
      sampleRateHertz: options.sampleRateHertz,
      languageCode: options.languageCode
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
            
            // Now ship this out to the specified Google Doc
          }
          else {
            record.stop();
            start();
          }
      });
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

// Run it!
listen(options);