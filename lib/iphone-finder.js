/**
 * Simple library to locate iOS devices (iPhone, iPod and iPad)
 *
 * Author: Thomas Henley
 */
var Buffer = require('buffer').Buffer;
var https  = require('https');

module.exports.findAllDevices = function(username, password, callback) {
    // Send a request to the find my iphone service for the partition host to use
    getPartitionHost(username, password, function(err, partitionHost) {
        // Now get the devices owned by the user
        if (err == null) {
            getDeviceDetails(partitionHost, username, password, callback);
        }
        else {
            callback(err);
        }
    });
}

function getPartitionHost(username, password, callback) {
    postRequest('fmipmobile.icloud.com', username, password, function(err, response) {
        // Return the partition host if available
        if (err == null) {
            var partitionHost = response.headers['x-apple-mme-host'];
            if (partitionHost != null) {
                return callback(null, partitionHost);
            }
            else {
                return callback(new Error("Login to icloud failed. Check your credentials"));
            }
        }
        else {
            return callback(err);
        }
    });
}

function getDeviceDetails(partitionHost, username, password, callback) {
    postRequest(partitionHost, username, password, function(err, response) {
        if (err == null) {
            try {
                var allDevices = JSON.parse(response.body).content;
                return callback(null, allDevices);
            }
            catch (e) {
                return callback(new Error("Invalid response from server"));
            }
        }
        else {
            return callback(err);
        }
    });
}

function postRequest(host, username, password, callback) {
    var apiRequest = https.request({
        host: host,
        path: '/fmipservice/device/' + username + '/initClient',
        headers: {
            Authorization: 'Basic ' + new Buffer(username + ':' + password).toString('base64')
        },
        method: 'POST'
    }, function(response) {
        var result = {headers: response.headers, body: ''};
        response.on('data', function(chunk) {result.body = result.body + chunk; });
        response.on('end', function() { return callback(null, result); });
    });
    apiRequest.on('error', function(err) { return callback(err) });
    apiRequest.end();
}
