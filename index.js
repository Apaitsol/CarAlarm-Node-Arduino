var express = require('express');
var SerialPort = require('serialport');
var admin = require('firebase-admin');

var serviceAccount = "serviceAccount.json";
var database = "https://caralarm-24042.firebaseio.com";

const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600, autoOpen: false });
var Readline = SerialPort.parsers.Readline;
const parser = new Readline();
var pressure_previous;

var app = express();

app.listen(process.env.PORT || 3000);

//--------------------------------------//
//-----Firebase functionality start-----//
//--------------------------------------//

admin.initializeApp(
	{
		credential: admin.credential.cert(serviceAccount),
		databaseURL: database,
		databaseAuthVariableOverride: {
			uid: "server-worker"
		}
	}
);

var db = admin.database();
var state = db.ref("/State");
var token = db.ref("/AndroidToken");
var registrationToken;

token.on("value", function(snapshot) {
		console.log(snapshot.val());
		registrationToken = snapshot.val();
	}, function(errorObject) {
		console.log("the read failed: ", errorObject.code);
	}
);

state.on("value", function(snapshot) {
		if(snapshot.val() == false && port.isOpen == true) {
			port.close();
			//console.log(snapshot.val(), "serial closed.");
		}
		else if(snapshot.val() == true && port.isOpen == false) {
			port.open((err) => {
				if (err) {
					return console.log('Error opening port: ', err.message);
				};
			});
			//console.log(snapshot.val(), "serial opened.");
		}
	}, function(errorObject) {
		console.log("The read failed: ", errorObject.code);
	}
);

var payload = {
	notification: {
		title: "Varoitus",
		body: "Auto pöllittiin."
	}
};

var options = {
	priority: "high"
};

//------------------------------------//
//-----Firebase functionality end-----//
//------------------------------------//

//app.use(express.static('public'));
app.get('/', function(req, res) {
        admin.messaging().sendToDevice(registrationToken, payload, options)
		.then(function(res) {
			console.log("Success", res);
		})
		.catch(function(err) {
			console.log("Error", err);
		});
     });
	 

 //-----------------------------//
 //-----Serial events start-----//
 //-----------------------------//
 
port.pipe(parser);

port.on('open', () => {
	//Avataan sarjaportti, tähän esim hälytys päällä ilmoitus
	console.log('Serial open\n');
});

port.on('close', () => {
	console.log("Serial closed")
});

parser.on('data', send);

 //---------------------------//
 //-----Serial events end-----//
 //---------------------------//

 //----------------------------------//
 //-----Data comparison function-----//
 //----------------------------------//
 
 function send(str) {
	
	res = str.split(", ").map(parseFloat);
	
	var latdec = res[0] + (res[1]/60);
	var lngdec = res[2] + (res[3]/60);
	
	console.log(res);
	
	
	if(!isNaN(latdec) && !isNaN(lngdec)) 
	{
		var latlng = db.ref("/LatLng");
		
		latlng.set({
			'latitude': latdec,
			'longitude': lngdec
		});
	}
	
	if(Math.abs(res[4] - pressure_previous) > 10)
	{
		admin.messaging().sendToDevice(registrationToken, payload, options)
		.then(function(res) {
			console.log("Success", res);
		})
		.catch(function(err) {
			console.log("Error", err);
		});
	}
	
	pressure_previous = res[4];
 }