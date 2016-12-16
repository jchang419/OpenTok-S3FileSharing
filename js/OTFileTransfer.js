 function OTFileTransfer(session, awsConfig) {
     var self = this;

     this.events = {};
     this.AWSBucket = new getS3Bucket(awsConfig);
     this.OTSession = session;

     session.on("signal:OT_S3_FILE_SHARING", fileReceived);

     function fileReceived(event) {
         // get file from s3 with signal event
         getFileFromS3(event, self.AWSBucket, getFileFromS3Callback);

         function getFileFromS3Callback(error, data) {
             if (error) {
                 console.log('getFileFromS3 failed: ' + error);
             } else {
                 console.log('getFileFromS3 succeeded');
                 fireEvent(event, data);
             }
         }
     }

     function fireEvent(event, data) {
         // update signal event data with file data

         // trigger receivedFile event
         var newSignal = Object.defineProperty(event, 'data', {
             value: data,
             writable: false
         });

         self.fire('receivedFile', newSignal); //data);
     }
 }

 // handles sending the file signal with type `OT_S3_FILE_SHARING`
 // and passing s3 parameters to send a file
 OTFileTransfer.prototype.sendFile = function(options, callback) {
     var _options = options;

     var session = this.OTSession;
     var s3bucket = this.AWSBucket;

     var fileToUpload = _options.file;
     var sessionId = session.id;

     // upload file to s3
     uploadFileToS3(sessionId, fileToUpload, s3bucket, uploadToS3Callback);

     function uploadToS3Callback(error, data) {
         if (error) {
             callback(error);
         } else {
             console.log('uploadFileToS3 succeeded with objectkey: ' + data);
             sendOTS3FileSharingSignal(data);
         }
     }

     // send signal to other parties with s3 object key
     function sendOTS3FileSharingSignal(data) {
         var signalOptions = {
             type: "OT_S3_FILE_SHARING",
             data: data
         }

         // add connection object if it exists
         if (_options.to) {
             signalOptions.to = _options.to;
         }

         session.signal(signalOptions, fileSignalSentCallback);
     }

     function fileSignalSentCallback(error) {
         if (error) {
             console.log("fileSignal error: " + error.message);
         } else {
             console.log("fileSignal sent");
         }
     }

 }

 OTFileTransfer.prototype.on = function(event, fn) {
     this.events[event] = this.events[event] || [];
     this.events[event].push(fn);
 }

 OTFileTransfer.prototype.fire = function(event, returnEvent) {
     if (this.events[event]) {
         this.events[event].forEach(function(fn) {
             fn(returnEvent);
         })
     }
 }
