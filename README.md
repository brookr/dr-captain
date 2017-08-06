# Doctor Captain
Live captioning service, with crowd-sourced corrections.

Transcription provided by Google Speech API. The source code is based on the streaming recognizer example they provide.  

## Setup

1. [Install SoX](https://www.npmjs.com/package/node-record-lpcm16#dependencies)
1. Get a Google Cloud Platform account: https://console.cloud.google.com/freetrial
1. Set up a service account key: https://console.cloud.google.com/apis/credentials
1. Make sure to .gitignore it.
1. gcloud auth activate-service-account --key-file=service-account-key.json

## Usage

Start up the program, specifying the Google Doc you want to write to, and optionally the threshold for audio to be considered 'silence':

```
  node app.js seattle-201d25-captions 0.05
```
