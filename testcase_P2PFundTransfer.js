'use strict';
var starttimeofOverallTestCase = new Date().getTime();
//var diameter = require('../lib/diameter');
var diameter = require('./node_modules/diameter/lib/diameter');

//var HOST = '192.168.1.32';
var HOST = '127.0.0.1';

//var PORT = 3869;
var PORT = 4000;

var options = {
    //beforeAnyMessage: diameter.logMessage,
    //afterAnyMessage: diameter.logMessage,
    port: PORT,
    host: HOST
};
//GLobal variables socket, connection and sessionId,
var socket = diameter.createConnection(options, function() {});
var connection = socket.diameterConnection;
var sessionId = random(1000,2000);



//function to generate a random sessionId
function random(low, high) {
    var sessionID = Math.random() * (high - low) + low;
    return sessionID.toString();
}
function findExecutionTime(start, requestName) 
{
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time of ' +requestName+': ' + time +"ms\n");  
}

// **************************************************************//
//        Creating Capabilities-Exchange request
// **************************************************************//
function createCERequest(connection) 
{
    var request = connection.createRequest("Diameter Common Messages", 'Capabilities-Exchange');
    request.body = request.body.concat([
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
        ['Host-IP-Address', '127.0.0.1'],
        ['Product-Name', 'Home Subscriber Server'],
        ['Vendor-Specific-Application-Id', [
        ['Vendor-Id',10415],
        ['Auth-Application-Id', 'Diameter Credit Control Application'],
        ['Auth-Application-Id', 'NASREQ Application'],
        ['Auth-Application-Id', '3GPP Sh'],
        ['Acct-Application-Id', 'Diameter Base Accounting'],
        ['Auth-Application-Id', '3GPP Cx']
        ]],
    ]);
    return request;
}
function sendCERequest(connection) {
    var CERequest = createCERequest(connection);
    // **************************************************************//
    //        Sending Capabilities-Exchange request
    // **************************************************************//
    console.log("Sending Capabilities-Exchange Request");
    //console.log(CERequest.body);
    var startTimeCER = new Date().getTime();
    connection.sendRequest(CERequest).then(function(responseCER) {

        // handle responseCER
        //console.log("Response command"+ JSON.stringify(responseCER));
        console.log("Capabilities-Exchange Request Sent");
        if (responseCER.command === 'Capabilities-Exchange') {
            console.log("Capabilities-Exchange Answer received");
            //console.log(responseCER.body);

            for (var i = 0; i < responseCER.body.length; i++) {
                if (responseCER.body[i][0] === "Result-Code") {
                    if (responseCER.body[i][1] === "DIAMETER_SUCCESS") {
                        console.log("Capabilities-Exchange is successful");
                        findExecutionTime(startTimeCER, "CER");
                        sendAuthenticationRequest(connection);
                        break;
                    }
                    else
                    {
                        console.log("Capabilities-Exchange failed");
                    }
                } 
            }
        }
        //console.log("Capabilities-Exchange Request sent to the server");
    }, function(error) {
        console.log('Error sending request: ' + error);
        //sendSTRequest(connection);
    });
}

// **************************************************************//
//			    Creating Authentication request  		     //
// **************************************************************//
function createAuthenticationRequest(connection) {
    var request = connection.createRequest("NASREQ Application", 'AA');
    request.body = request.body.concat([
        ['Session-Id', sessionId],
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
        ['Destination-Realm', 'www.safarifone.com'],
        ['Client-Request-Id', '23mjyrt65m'],
        ['Diameter-Event-Id', 'qh4bpRn95gCMx1VZ'],
        //['Auth-Application-Id', 1],
        ['Auth-Request-Type', 1],
        ['Subscription-Id', [
            ['Subscription-Id-Type', 0],
            ['Subscription-Id-Data', new Buffer('252615100005', 'utf-8')]
        ]],
        ['User-Equipment-Info', [
            ['User-Equipment-Info-Type', 1],
            ['User-Equipment-Info-Value', new Buffer.from("123456", 'utf-8')]
        ]],
        ['User-Name', '252615100005'],
        ['User-Password', new Buffer.from("1212", 'utf-8')],
        ['Service-Type', 18],
        ['IMSI', '252615100005'],
        ['Account-Currency', '840'],
        ['SDP-System-Info', [
            ['System-IP', new Buffer('192.168.40.100', 'utf-8')],
            ['System-Secret', new Buffer('123456', 'utf-8')]
        ]],
        ['Channel-Info', [
            ['Channel-Name', new Buffer('USSD', 'utf-8')],
        ]],
        [ 'Location-Info', [
            [ 'Location-Type',  2],
            [ 'Location-Info-Type',  1],
            [ 'CELL-ID',  110],
            [ 'LAC-ID',  342],
            [ 'MCC',  '1'],
            [ 'Location-Info-Type',  new Buffer('252', 'utf-8')],
            [ 'MNC',  new Buffer('62', 'utf-8')]
        ]],
    ]);
    return request;
}
function sendAuthenticationRequest(connection) {
    var authenticationRequest = createAuthenticationRequest(connection);
    // **************************************************************//
    //        Sending Authentication request
    // **************************************************************//
    console.log("Sending Authentication Request");
    //console.log(authenticationRequest.body);
    var startTimeAuthentication = new Date().getTime();
    connection.sendRequest(authenticationRequest).then(function(responseAuthentication) {
                // handle response
                console.log("Authentication Request Sent");
                if (responseAuthentication.command === 'AA') {
                console.log("Authentication Answer received");
                for (var i = 0; i < responseAuthentication.body.length; i++) {
                    if (responseAuthentication.body[i][0] === "Result-Code") {
                        if (responseAuthentication.body[i][1] === "DIAMETER_SUCCESS") {
                            console.log("Authentication is successful");
                            findExecutionTime(startTimeAuthentication, "Authentication");
                            sendAuthorizationRequest(connection);
                            //sendSTRequest(connection);
                            break;
                        } else
                        {
                           console.log("Authentication failed");
                           sendSTRequest(connection);
                        }
                    } 
                }
            }
        },
        function(error) {
            console.log('Error sending request: ' + error);
            sendSTRequest(connection);
        });
}

function createAuthorizationRequest(connection) {
    var request = connection.createRequest("NASREQ Application", 'AA');
    request.body = request.body.concat([
    ['Session-Id', sessionId],
    ['Origin-Host', 'mfssdp.safarifone.com'],
    ['Origin-Realm', 'www.safarifone.com'],
    ['Destination-Realm', 'www.safarifone.com'],
    ['Client-Request-Id', '23mjyrt65m'],
    ['Diameter-Event-Id', 'gHli00G0kvMcvOir'],
    //['Auth-Application-Id', 1],
    ['Auth-Request-Type', 2],
    ['Service-Context-Id', '123'],
    ['Event-Timestamp', '2540001'],
    ['Account-Id', 8],
    ['Receiver-Subscription-Id', [
            ['Subscription-Id-Type', 0],
            ['Subscription-Id-Data', new Buffer('252617728392', 'utf-8')]
    ]],
    ['Service-Information', [
        ['Service', [
        ['Service-Id', '6'],
        ['Service-Code', new Buffer('0006', 'utf-8')],
        ['Service-Name',  new Buffer('P2P Transfer', 'utf-8')]
        ]],
    ]],
    ['TxAmount', [
        ['CC-Money',[
            ['Unit-Value',[
                
                ['Value-Digits', 2],
                ['Exponent', 0]
            ]], 
       ]],
    ]],
    ['Service-Type', 18],
    ['Currency-Code', '840'],
    ['Origin-System-IP',  new Buffer('192.168.99.100', 'utf-8')]
    ]);
    return request;
}

function sendAuthorizationRequest(connection) {
    var authorizationRequest = createAuthorizationRequest(connection);
    // **************************************************************//
    //        Sending Authentication request
    // **************************************************************//
    console.log("Sending Authorization Request");
    //console.log(authorizationRequest.body);
    var startTimeAuthorization = new Date().getTime();
    connection.sendRequest(authorizationRequest).then(function(responseAuthorization) {
                // handle response
                console.log("Authorization Request Sent");
                if (responseAuthorization.command === 'AA') {
                console.log("Authorization Answer received");
                //console.log(responseAuthorization.body);

                for (var i = 0; i < responseAuthorization.body.length; i++) {
                    if (responseAuthorization.body[i][0] === "Result-Code") {
                        if (responseAuthorization.body[i][1] === "DIAMETER_SUCCESS") {
                            console.log("Authorization is successful");
                            findExecutionTime(startTimeAuthorization, "Authorization");
                            sendChargingRequest(connection);
                            break;
                        } else
                        {
                            console.log("Authorization failed");
                            sendSTRequest(connection);
                        }
                    } 
                }
            }
        },
        function(error) {
            console.log('Error sending request: ' + error);
            sendSTRequest(connection);
        });
}

function createCharingRequest(connection) {
    var request = connection.createRequest("Diameter Credit Control Application", 'Credit-Control');
    request.body = request.body.concat([
        ['Session-Id', sessionId],
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
        ['Destination-Realm', 'www.safarifone.com'],
        ['Client-Request-Id','23mjyrt65m'],
        ['Diameter-Event-Id','8tG2f0qhAlZBXrX3'],
        ['CC-Request-Type',4],
        ['CC-Request-Number','10'],
        ['Service-Context-Id','123'],
        ['Requested-Action',0], 
        ['Event-Timestamp','2540001'], 
        ['Service-Exec-Time',322], 
        ['Used-Service-Unit', [
            ['CC-Money',[
                ['Unit-Value',[
                    
                    ['Value-Digits', 2],
                    ['Exponent', 0],
                ]], 
           ]],
        ]],
        ['Currency-Code','840']
        

    ]);
    return request;
}

function sendChargingRequest(connection) {
    var chargingRequest = createCharingRequest(connection);
    // **************************************************************//
    //        Sending Authentication request
    // **************************************************************//
    console.log("Sending Charging Request"); 
    //console.log(chargingRequest.body);
    var startTimeCharging = new Date().getTime();
    connection.sendRequest(chargingRequest).then(function(responseCharging) {
                // handle response
                console.log("Charging Request Sent");
                if (responseCharging.command === 'Credit-Control') {
                console.log("Charging Answer received");
                for (var i = 0; i < responseCharging.body.length; i++) {
                    if (responseCharging.body[i][0] === "Result-Code") {
                        if (responseCharging.body[i][1] === "DIAMETER_SUCCESS") {
                            console.log("Charging is successful");
                            findExecutionTime(startTimeCharging, "Charging");
                            sendSTRequest(connection);
                            break;
                        } else
                        {
                            console.log("Charging failed");
                            sendSTRequest(connection);
                        }
                    } 
                }
            }
        },
        function(error) {
            console.log('Error sending request: ' + error);
            sendSTRequest(connection);
        });
}

function createDWRequest(connection) {
    var request = connection.createRequest("Diameter Base Accounting", 'Device-Watchdog');
    request.body = request.body.concat([
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
    ]);
    return request;
}
function sendDWRequest(connection) {
    var DWRequest = createDWRequest(connection);
    // **************************************************************//
    //        Sending Capabilities-Exchange request
    // **************************************************************//
    console.log("Sending DWRequest from client side");
    var startTimeDWR = new Date().getTime();
    connection.sendRequest(DWRequest).then(function(responseDWR) {
        // handle responseDWR
        console.log("DWRequest Sent from client side");
        if (responseDWR.command === 'Device-Watchdog') 
        {
            console.log("Device-Watchdog Answer received from server side");
            findExecutionTime(startTimeDWR, "Device-Watchdog");
        }
    }, function(error) {
        console.log('Error sending request: ' + error);
    });
}



function createSTRequest(connection) {
    var request = connection.createRequest("NASREQ Application", 'Session-Termination');
    request.body = request.body.concat([
        ['Session-Id', sessionId],
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
        ['Destination-Realm', 'www.safarifone.com'],
        ['Auth-Application-Id', 1],
        ['Termination-Cause', 1],
    ]);
    return request;
}
function sendSTRequest(connection) {
    var STRequest = createSTRequest(connection);
    // **************************************************************//
    //		  Sending Capabilities-Exchange request
    // **************************************************************//
    console.log("Sending Session termination Request");

    var startTimeSTR = new Date().getTime();
    connection.sendRequest(STRequest).then(function(responseSTR) {
        // handle responseSTR
        //console.log("Response command"+ JSON.stringify(responseSTR));
        if (responseSTR.command === 'Session-Termination') {
            console.log("Session termination Answer received\n");
            for (var i = 0; i < responseSTR.body.length; i++) {
                if (responseSTR.body[i][0] === "Result-Code") {
                    if (responseSTR.body[i][1] === "DIAMETER_SUCCESS") {
                        findExecutionTime(startTimeSTR, "Session-Termination");
                        findExecutionTime(starttimeofOverallTestCase, "overall test case execution");
                        console.log("Session has been successfully terminated\n");
                        break;
                    }
                    else
                    {
                        console.log("Session Termination failed");
                    }
                } 
            }
        }
    }, function(error) {
        console.log('Error sending request: ' + error);
    });

    //close socket and delete DWR timer.
    socket.diameterConnection.end();
    clearInterval(interval);
}



sendCERequest(connection);

const interval = setInterval(function() {
sendDWRequest(connection);

 }, 5000);

//clearInterval(interval);


// **************************************************************//
//		  Handling server initiated messages:
// **************************************************************//
socket.on('diameterMessage', function(event) {

    if (event.message.command === 'AA') {
        console.log("Server initiated message received");
        //console.log(event.response.body);
    }
     else if (event.message.command === 'Device-Watchdog') {
            console.log("Device-Watchdog Response received from server");
            event.response.body = event.response.body.concat([
                ['Origin-Host','mfscbs.safarifone.com'],
                ['Origin-Realm','www.safarifone.com'],
                ['Result-Code',2001],
            ]);
            event.callback(event.response);
        }
    //socket.diameterConnection.end();
});
socket.on('error', function(err) {
    console.log(err);
});



//npm install -g node-diameter/node-diameter
//npm install diameter / node-diameter