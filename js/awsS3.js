/*
AWS api wrapper
*/

// Connect to AWS cognito and create a bucket locally
function getS3Bucket(awsConfig) {
    // set the Amazon Cognito region
    AWS.config.region = awsConfig.awsCognitoRegion;
    // initialize the Credentials object with our parameters
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: awsConfig.cognitoIdentityPoolId
    });

    // get identity ID and update credentials
    AWS.config.credentials.get(function(err) {
        if (err) {
            console.log("Error: " + err);
            return;
        } else {
            console.log("Cognito Identity Id: " + AWS.config.credentials.identityId);
            AWS.config.update({
                credentials: AWS.config.credentials.identityId
            });
        }
    });

    // create the s3 bucket locally
    var s3 = new AWS.S3();
    var bucketName = awsConfig.awsBucketName;
    var bucket = new AWS.S3({
        params: {
            Bucket: bucketName
        }
    });

    return bucket;
};

// upload object to S3 with sessionID/uuid as objectkey
function uploadFileToS3(sessionId, file, bucket, callback) {
    var _bucket = bucket;
    var _sessionId = sessionId;
    var _callback = callback;
    var _fileToUpload = file;
    var _fileId = uuid();
    var _objKey = _sessionId + '/' + _fileId;

    // upload file to s3
    if (_fileToUpload) {
        var params = {
            Key: _objKey,
            ContentType: _fileToUpload.type,
            Body: _fileToUpload,
            ACL: 'public-read'
        };

        _bucket.putObject(params, _s3UploadErrorHandler);
        // s3 upload failed
    } else {
        console.log('uploadFileToS3 failed: Choose a file to upload')
    }

    // callback for s3 upload
    function _s3UploadErrorHandler(err, data) {
        if (err) {
            _callback(err, null);
        } else {
            _callback(null, _objKey);
        }
    }
}

// get file with sessionID/uuid from s3
function getFileFromS3(event, AWSBucket, callback) {
    var _callback = callback;
    var _bucket = AWSBucket;
    var _event = event;
    var _fileName = _event.data;

    var _params = {
        Key: _fileName
    };

    _bucket.getObject(_params, function(err, data) {
        if (err) {
            _callback(err, null);
        } else {
            _callback(null, data);
            //delete obj from bucket once the file has been successfully downloaded
            _bucket.deleteObject(_params, function(err, data) {
                // error
                if (err) console.log('error deleting s3 object ' + err);
                // deleted
                else console.log('file was successfully deleted');
            });
        }
    });
}

// delete a file with sessionID/uuid from s3
// not used, but depending on app logic, it can be
function deleteFileFromS3(event, AWSBucket, callback) {
    var _callback = callback;
    var _bucket = AWSBucket;
    var _event = event;
    var _fileName = _event.data;

    var _params = {
        Key: _fileName
    };

    //delete obj from bucket once the file has been successfully downloaded
    _bucket.deleteObject(_params, function(err, data) {
        // error
        if (err) console.log('error deleting s3 object ' + err);
        // deleted
        else console.log('file was successfully deleted');
    });
}

// helpers

// generate uuid
function uuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
