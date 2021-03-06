'use strict';
var starttimeofOverallTestCase = new Date().getTime();
var diameter = require('./node_modules/diameter/lib/diameter');

var HOST = '192.168.1.32';
//var HOST = '127.0.0.1';
var PORT = 3869;
var options = {
    //beforeAnyMessage: diameter.logMessage,
    //afterAnyMessage: diameter.logMessage,
    port: PORT,
    host: HOST
};
//GLobal variables socket, connection and sessionId,
var socket = diameter.createConnection(options, function() {});
var connection = socket.diameterConnection;
var sessionId = generateRandomSessionId(1000,2000);
var clientRequestId = generateRandomClientRequestId(1000,700000);
//var diameterEventId = generateRandomDiameterEventId(1000,600000);

var numberOfExecutions = 10;
var executionCounter = 1;
console.log('\x1b[33m%s\x1b[0m', "Starting execution from here.");  //yellow

//function to generate a random sessionId
function generateRandomSessionId(low, high) {
    var sessionID = Math.random() * (high - low) + low;
    return sessionID.toString();
}
//function to generate a random Client request id
function generateRandomClientRequestId(low, high) {
    var clientRequestId = Math.random() * (high - low) + low;
    return clientRequestId.toString();
}
//function to generate a random Client request id
function generateRandomDiameterEventId(low, high) {
    var diamterEventId = Math.random() * (high - low) + low;
    return diamterEventId.toString();
}

function findExecutionTime(start, requestName) 
{
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time of ' +requestName+': ' + time +"ms\n");  
}
const interval = setInterval(function() {
sendDWRequest(connection);

 }, 1000);
//        Creating Capabilities-Exchange request
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
    //        Sending Capabilities-Exchange request
    console.log("Sending Capabilities-Exchange Request");
    var startTimeCER = new Date().getTime();
    connection.sendRequest(CERequest).then(function(responseCER) {
        console.log("Capabilities-Exchange Request Sent");
        if (responseCER.command === 'Capabilities-Exchange') {
            console.log("Capabilities-Exchange Answer received");
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
    }, function(error) {
        console.log('Error sending request: ' + error);
    });
}

//			    Creating Authentication request  		     //
function createAuthenticationRequest(connection) {
    
    var request = connection.createRequest("NASREQ Application", 'AA', sessionId);
    request.body = request.body.concat([
        //['Session-Id', sessionId],
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
        ['Destination-Realm', 'www.safarifone.com'],
        ['Client-Request-Id', clientRequestId],
        ['Diameter-Event-Id', generateRandomDiameterEventId(1000,600000)],
        ['Auth-Request-Type', 1],
        ['Subscription-Id', [
            ['Subscription-Id-Type', 0],
            ['Subscription-Id-Data', new Buffer.from('252615100005', 'utf-8')]
        ]],
        ['User-Equipment-Info', [
            ['User-Equipment-Info-Type', 1],
            ['User-Equipment-Info-Value', new Buffer.from("123456", 'utf-8')]
        ]],
        ['User-Name', '252615100005'],
        ['User-Password', new Buffer.from("1212", 'utf-8')],
        ['Service-Type', 18], // mmt, 
        ['IMSI', '252615100005'], 
        ['Account-Currency', '840'], // for usd
        ['SDP-System-Info', [
            ['System-IP', new Buffer.from('192.168.40.100', 'utf-8')],
            ['System-Secret', new Buffer.from('123456', 'utf-8')]
        ]],
        ['Channel-Info', [
            ['Channel-Name', new Buffer.from('USSD', 'utf-8')],
        ]],
        [ 'Location-Info', [
            [ 'Location-Type',  2],
            [ 'Location-Info-Type',  1],
            [ 'CELL-ID',  110],
            [ 'LAC-ID',  342],
            [ 'MCC',  '1'],
            [ 'Location-Info-Type',  new Buffer.from('252', 'utf-8')],
            [ 'MNC',  new Buffer.from('62', 'utf-8')]
        ]],
    ]);
    return request;
}
function sendAuthenticationRequest(connection) {
    console.log('\x1b[36m%s\x1b[0m', "Execution cycle: "+ executionCounter);  //cyan
    var authenticationRequest = createAuthenticationRequest(connection);
    //        Sending Authentication request
    console.log("Sending Authentication Request");
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
    var request = connection.createRequest("NASREQ Application", 'AA', sessionId);
    request.body = request.body.concat([
    //['Session-Id', sessionId],
    ['Origin-Host', 'mfssdp.safarifone.com'],
    ['Origin-Realm', 'www.safarifone.com'],
    ['Destination-Realm', 'www.safarifone.com'],
    ['Client-Request-Id', clientRequestId],
    ['Diameter-Event-Id', generateRandomDiameterEventId(1000,600000)],
    //['Auth-Application-Id', 1],
    ['Auth-Request-Type', 2],
    ['Service-Context-Id', '123'],
    ['Event-Timestamp', '2540001'],
    ['Account-Id', 8], // 
    ['Receiver-Subscription-Id', [
            ['Subscription-Id-Type', 0],
            ['Subscription-Id-Data', new Buffer.from('252617728392', 'utf-8')]
    ]],
    ['Service-Information', [
        ['Service', [
        ['Service-Id', '6'],
        ['Service-Code', new Buffer.from('0006', 'utf-8')],
        ['Service-Name',  new Buffer.from('P2P Transfer', 'utf-8')]
        ]],
    ]],
    ['TxAmount', [
        ['CC-Money',[
            ['Unit-Value',[
                
                ['Value-Digits', 2],
                ['Exponent', 0]
            ]],
            ['Currency-Code', 840]
        ]],
    ]],
    ['Service-Type', 18],
    ['Origin-System-IP',  new Buffer.from('192.168.99.100', 'utf-8')]
    ]);
    return request;
}

function sendAuthorizationRequest(connection) {
    var authorizationRequest = createAuthorizationRequest(connection);
    //        Sending Authentication request
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
    var request = connection.createRequest("Diameter Credit Control Application", 'Credit-Control', sessionId);
    request.body = request.body.concat([
        //['Session-Id', sessionId],
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
        ['Destination-Realm', 'www.safarifone.com'],
        ['Client-Request-Id',clientRequestId],
        ['Diameter-Event-Id',generateRandomDiameterEventId(1000,600000)],
        ['CC-Request-Type',4],
        ['CC-Request-Number','10'],
        ['Service-Context-Id','123'],
        ['Requested-Action',0], //ECUR, IEC , SCUR
        ['Event-Timestamp','2540001'], 
        ['Service-Exec-Time',322], 
        ['Used-Service-Unit', [
            ['CC-Money',[
                ['Unit-Value',[

                    ['Value-Digits', 2],
                    ['Exponent', 0]
                ]],
                ['Currency-Code', 840]
            ]],
        ]],


    ]);
    return request;
}

function sendChargingRequest(connection) {
    var chargingRequest = createCharingRequest(connection);
    //        Sending Authentication request
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
    //        Sending Capabilities-Exchange request
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
    var request = connection.createRequest("NASREQ Application", 'Session-Termination', sessionId);
    request.body = request.body.concat([
        //['Session-Id', sessionId],
        ['Origin-Host', 'mfssdp.safarifone.com'],
        ['Origin-Realm', 'www.safarifone.com'],
        ['Destination-Realm', 'www.safarifone.com'],
        ['Auth-Application-Id', 1],
        ['Termination-Cause', 1]
    ]);
    return request;
}
function sendSTRequest(connection) {
    var STRequest = createSTRequest(connection);
    //		  Sending Capabilities-Exchange request
    console.log("Sending Session termination Request");
    var startTimeSTR = new Date().getTime();
    connection.sendRequest(STRequest).then(function(responseSTR) {
        if (responseSTR.command === 'Session-Termination') {
            console.log("Session termination Answer received");
            for (var i = 0; i < responseSTR.body.length; i++) {
                if (responseSTR.body[i][0] === "Result-Code") {
                    if (responseSTR.body[i][1] === "DIAMETER_SUCCESS") {
                        findExecutionTime(startTimeSTR, "Session-Termination");
                        findExecutionTime(starttimeofOverallTestCase, "overall test case execution");
                        console.log("Session has been successfully terminated");
                            if(executionCounter<=numberOfExecutions)

                            {
                                sessionId = generateRandomSessionId(1000,2000);
                                clientRequestId = generateRandomClientRequestId(1000,700000);
                                sendAuthenticationRequest(connection);
                                executionCounter++;
                            }
                            else
                            {
                                //close socket and delete DWR timer.
                                socket.diameterConnection.end();
                                clearInterval(interval);
                                break;
                            }
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
    
}
function executeCompleteTestCase(callback)
{
    sendAuthenticationRequest(connection);

}

sendCERequest(connection);

//		  Handling server initiated messages:
socket.on('diameterMessage', function(event) {

    if (event.message.command === 'AA') {
        console.log("Server initiated message received");
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
});
socket.on('error', function(err) {
    console.log(err);
});
