'use strict';

var diameter = require('./node_modules/diameter/lib/diameter');
var HOST = '127.0.0.1';
var PORT = 3869;

var options = {
    //beforeAnyMessage: diameter.logMessage,
    //afterAnyMessage: diameter.logMessage,
};


        //function to generate a random sessionId
function random(low, high) {
    var sessionID = Math.random() * (high - low) + low;
    return sessionID.toString();
}

var server = diameter.createServer(options, function(socket) {
    socket.on('diameterMessage', function(event) {
        if (event.message.command === 'Capabilities-Exchange') {
            event.response.body = event.response.body.concat([
                ['Result-Code', 'DIAMETER_SUCCESS'],
                ['Origin-Host', 'test.com'],
                ['Origin-Realm', 'com'],
                ['Host-IP-Address', '2001:db8:3312::1'],
                ['Host-IP-Address', '1.2.3.4'],
                ['Vendor-Id', 123],
                ['Product-Name', 'node-diameter']
            ]);
            event.callback(event.response);

        } else if (event.message.command === 'Credit-Control') {
            event.response.body = event.response.body.concat([
                ['Result-Code', 2001], // You can also define enum values by their integer codes
                [264, 'test.com'], // or AVP names, this is 'Origin-Host'
                ['Origin-Realm', 'com'],
                ['Auth-Application-Id', 'Diameter Credit Control Application'],
                ['CC-Request-Type', 'INITIAL_REQUEST'],
                ['CC-Request-Number', 0],
                ['Multiple-Services-Credit-Control', [
                    ['Granted-Service-Unit', [
                        ['CC-Time', 123],
                        ['CC-Money', [
                            ['Unit-Value', [
                                ['Value-Digits', 123],
                                ['Exponent', 1]
                            ]],
                            ['Currency-Code', 1]
                        ]],
                        ['CC-Total-Octets', 123],
                        ['CC-Input-Octets', 123],
                        ['CC-Output-Octets', 123]
                    ]],
                    ['Requested-Service-Unit', [
                        ['CC-Time', 123],
                        ['CC-Money', [
                            ['Unit-Value', [
                                ['Value-Digits', 123],
                                ['Exponent', 1]
                            ]],
                            ['Currency-Code', 1]
                        ]],
                        ['CC-Total-Octets', 123],
                        ['CC-Input-Octets', 123],
                        ['CC-Output-Octets', 123]
                    ]]
                ]]
            ]);
            event.callback(event.response);
        }
        else if (event.message.command === 'AA') 
        {
            event.response.body = event.response.body.concat([
                ['Session-Id','dZH7jGEadGog2Uw4'],
                ['Origin-Host','mfscbs.safarifone.com'],
                ['Origin-Realm','www.safarifone.com'],
                ['Session-Timeout','70000'],
                ['Result-Code',2001],
                ['Reply-Message','Authentication Successful'],
                ['Auth-Request-Type',1],

            ]);
            event.callback(event.response);
        }
        else if (event.message.command === 'Device-Watchdog') {
            sendDWRequestFromServerSide();
            event.response.body = event.response.body.concat([
                ['Origin-Host','mfscbs.safarifone.com'],
                ['Origin-Realm','www.safarifone.com'],
                ['Result-Code',2001],
            ]);
            event.callback(event.response);
        }
        else if (event.message.command === 'Session-Termination') {
            event.response.body = event.response.body.concat([
                ['Session-Id','X0ungXYxUKCadUty'],
                ['Origin-Host','mfscbs.safarifone.com'],
                ['Origin-Realm','www.safarifone.com'],
                ['Service-Exec-Time','4'],
                ['Result-Code',2001],
                ['Reply-Message','SUCCESS'],
            ]);
            event.callback(event.response);
        }

    function createDWRequestFromServerSide() {
        var connection = socket.diameterConnection;
        var request = connection.createRequest("Diameter Base Accounting", 'Device-Watchdog');
        request.body = request.body.concat([
            ['Origin-Host', 'mfssdp.safarifone.com'],
            ['Origin-Realm', 'www.safarifone.com'],
        ]);
        return request;
    }
    function sendDWRequestFromServerSide() {
        var connection = socket.diameterConnection;
        var DWRequest = createDWRequestFromServerSide();
        //        Sending Capabilities-Exchange request
        console.log("Sending DWRequest from server side");
        connection.sendRequest(DWRequest).then(function(responseDWR) {
            // handle responseDWR
            console.log("DWRequest Sent from server side.");
            if (responseDWR.command === 'Device-Watchdog') 
            {
                console.log("Device-Watchdog Answer received from client side\n");
            }
        }, function(error) {
            console.log('Error sending request: ' + error);
        });
    }

    });

    socket.on('end', function() {
        console.log('Client disconnected.');
    });
    socket.on('error', function(err) {
        console.log(err);
    });
});

server.listen(PORT, HOST);

console.log('Started DIAMETER server on ' + HOST + ':' + PORT);
