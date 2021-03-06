//////////////////////////////////////////////////////////////////////////////
// Indoor Localisation Service
var indoorLocalisationServiceUuid = '7e170000-429c-41aa-83d7-d91220abeb33';
// Indoor Localisation Service - Characteristics
var rssiUuid = '7e170001-429c-41aa-83d7-d91220abeb33';
var addTrackedDeviceUuid = '7e170002-429c-41aa-83d7-d91220abeb33';
var deviceScanUuid = '7e170003-429c-41aa-83d7-d91220abeb33';
var deviceListUuid = '7e170004-429c-41aa-83d7-d91220abeb33';
var listTrackedDevicesUuid = '7e170005-429c-41aa-83d7-d91220abeb33';
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// General Service
var generalServiceUuid = 'f5f90000-59f9-11e4-aa15-123b93f75cba';
// General Service - Characteristics
var temperatureCharacteristicUuid = 'f5f90001-59f9-11e4-aa15-123b93f75cba';
var changeNameCharacteristicUuid = 'f5f90002-59f9-11e4-aa15-123b93f75cba';
var deviceTypeUuid = 'f5f90003-59f9-11e4-aa15-123b93f75cba';
var roomUuid = 'f5f90004-59f9-11e4-aa15-123b93f75cba';
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// Power Service
var powerServiceUuid = '5b8d0000-6f20-11e4-b116-123b93f75cba';
// Power Service - Characteristics
var pwmUuid = '5b8d0001-6f20-11e4-b116-123b93f75cba';
var sampleCurrentUuid = '5b8d0002-6f20-11e4-b116-123b93f75cba';
var currentCurveUuid = '5b8d0003-6f20-11e4-b116-123b93f75cba';
var currentConsumptionUuid = '5b8d0004-6f20-11e4-b116-123b93f75cba';
var currentLimitUuid = '5b8d0005-6f20-11e4-b116-123b93f75cba';
//////////////////////////////////////////////////////////////////////////////


var BLEHandler = function() {
	var self = this;
	var addressKey = 'address';
	var dobotsCompanyId = 0x1111 // has to be defined, this is only a dummy value

	var scanTimer = null;
	var connectTimer = null;
	var reconnectTimer = null;

	var iOSPlatform = "iOS";
	var androidPlatform = "Android";

	self.init = function(callback) {
		console.log("Initializing connection");
		bluetoothle.initialize(function(obj) {
				console.log('Properly connected to BLE chip');
				console.log("Message " + JSON.stringify(obj));
				if (obj.status == 'enabled' || obj.status == 'initialized') {
					callback(true);
				}
			}, 
			function(obj) {
				console.log('Connection to BLE chip failed');
				console.log('Message', obj.status);
				navigator.notification.alert(
						'Bluetooth is not turned on, or could not be turned on. Make sure your phone has a Bluetooth 4.+ (BLE) chip.',
						null,
						'BLE off?',
						'Sorry!');
				callback(false);
			}, 
			{"request": true});
	}

	self.connectDevice = function(address, callback) {
		console.log("Beginning to connect to " + address + " with 5 second timeout");
		var paramsObj = {"address": address};
		bluetoothle.connect(function(obj) { // connectSuccess
				if (obj.status == "connected") {
					console.log("Connected to: " + obj.name + " - " + obj.address);

					self.clearConnectTimeout();

					if (callback) {
						callback(true);
					}

				}
				else if (obj.status == "connecting") {
					console.log("Connecting to: " + obj.name + " - " + obj.address);
				}
				else {
					console.log("Unexpected connect status: " + obj.status);
					self.clearConnectTimeout();
					self.closeDevice(obj.address);
					if (callback) {
						callback(false);
					}
				}
			}, 
			function(obj) { // connectError
				console.log("Connect error: " + obj.error + " - " + obj.message);
				self.clearConnectTimeout();
				if (callback) {
					callback(false);
				}
			}, 
			paramsObj);

		self.connectTimer = setTimeout(function() { // connectTimeout
				console.log('Connection timed out, stop connection attempts');
				if (callback) {
					callback(false);
				}
			}, 
			5000);
	}

	self.clearConnectTimeout = function() { 
		console.log("Clearing connect timeout");
		if (self.connectTimer != null) {
			clearTimeout(self.connectTimer);
		}
	}

	// self.reconnect = function() {
	// 	console.log("Reconnecting with 5 second timeout");
	// 	bluetoothle.reconnect(self.reconnectSuccess, self.reconnectError);
	// 	self.reconnectTimer = setTimeout(self.reconnectTimeout, 5000);
	// }

	// self.reconnectSuccess = function(obj) {
	// 	if (obj.status == "connected") {
	// 		console.log("Reconnected to: " + obj.name + " - " + obj.address);

	// 		self.clearReconnectTimeout();

	// 		if (window.device.platform == iOSPlatform) {
	// 			console.log("Discovering services");
	// 			// var paramsObj = {"serviceUuids": [alertLevelServiceUuid] };
	// 			// bluetoothle.services(self.alertLevelSuccess, self.alertLevelError, paramsObj);
	// 		} else if (window.device.platform == androidPlatform) {
	// 			console.log("Beginning discovery");
	// 			bluetoothle.discover(self.discoverSuccess, self.discoverError);
	// 		}
	// 	} else if (obj.status == "connecting") {
	// 		console.log("Reconnecting to : " + obj.name + " - " + obj.address);
	// 	} else {
	// 		console.log("Unexpected reconnect status: " + obj.status);
	// 		self.disconnectDevice();
	// 	}
	// }

	// self.reconnectError = function(obj) {
	// 	console.log("Reconnect error: " + obj.error + " - " + obj.message);
	// 	disconnectDevice();
	// }

	// self.reconnectTimeout = function() {
	// 	console.log("Reconnection timed out");
	// }

	// self.clearReconnectTimeout = function() { 
	// 	console.log("Clearing reconnect timeout");
	// 	if (self.reconnectTimer != null) {
	// 		clearTimeout(self.reconnectTimer);
	// 	}
	// }

	self.discoverServices = function(address, callback) {
		console.log("Beginning discovery of services for device" + address);
		var paramsObj = {address: address};
		bluetoothle.discover(function(obj) { // discover success
				if (obj.status == "discovered")
				{
					console.log("Discovery completed");
					var services = obj.services;
					for (var i = 0; i < services.length; ++i) {
						var serviceUuid = services[i].serviceUuid;
						var characteristics = services[i].characteristics;
						for (var j = 0; j < characteristics.length; ++j) {
							var characteristicUuid = characteristics[j].characteristicUuid;
							console.log("Found service " + serviceUuid + " with characteristic " + characteristicUuid);

							if (callback) {
								callback(serviceUuid, characteristicUuid);
							}
						}
					}
				}
				else
				{
					console.log("Unexpected discover status: " + obj.status);
					self.disconnectDevice(address);
				}
			}, 
			function(obj) { // discover error
				console.log("Discover error: " + obj.error + " - " + obj.message);
				self.disconnectDevice(address);	
				if (callback) {
					callback(false);
				}
			}, 
			paramsObj);
	}
	
	self.startEndlessScan = function(callback) {
		console.log('start endless scan');
		var paramsObj = {}
		bluetoothle.startScan(function(obj) {  // start scan success
				if (obj.status == 'scanResult') {
					var arr = bluetoothle.encodedStringToBytes(obj.advertisement);
					self.parseAdvertisement(arr, 0xFF, function(data) {
						var value = data[0] << 8 | data[1];
						if (value == dobotsCompanyId) {
							callback(obj);
						}
					})
				} else if (obj.status == 'scanStarted') {
					console.log('Endless scan was started successfully');
				} else {
					console.log('Unexpected start scan status: ' + obj.status);
					console.log('Stopping scan');
					stopEndlessScan();
				}
			}, 
			function(obj) { // start scan error
				console.log('Scan error', obj.status);
				navigator.notification.alert(
						'Could not find a device using Bluetooth scanning.',
						null,
						'Status',
						'Sorry!');
			}, 
			paramsObj);
	}

	self.stopEndlessScan = function() {
		console.log("stop endless scan...");
		bluetoothle.stopScan(function(obj) { // stop scan success
				if (obj.status == 'scanStopped') {
					console.log('Scan was stopped successfully');
				} else {
					console.log('Unexpected stop scan status: ' + obj.status);
				}
			}, 
			function(obj) { // stop scan error
				console.log('Stop scan error: ' + obj.error + ' - ' + obj.message);
			});
	}
	
	self.parseAdvertisement = function(obj, search, callback) {
		var start = 0;
		var end = obj.length;
		for (var i = 0; i < obj.length; ) {
			var el_len = obj[i];
			var el_type = obj[i+1];
			if (el_type == search) {
				var begin = i+2;
				var end = begin + el_len - 1;
				var el_data = obj.subarray(begin, end);
				callback(el_data);
				return;
			} else if (el_type == 0) {
				// console.log(search.toString(16) + " not found!");
				return;
			} else {
				i += el_len + 1;
			}
		}
	}

	self.disconnectDevice = function(address) {
		var paramsObj = {"address": address}
		bluetoothle.disconnect(function(obj) { // disconnect success
				if (obj.status == "disconnected")
				{
					console.log("Device " + obj.address + " disconnected");
					self.closeDevice(obj.address);
				}
				else if (obj.status == "disconnecting")
				{
					console.log("Disconnecting device " + obj.address);
				}
				else
				{
					console.log("Unexpected disconnect status from device " + obj.address + ": " + obj.status);
				}
			}, 
			function(obj) { // disconnect error
				console.log("Disconnect error from device " + obj.address + ": " + obj.error + " - " + obj.message);
			}, 
			paramsObj);
	}

	self.closeDevice = function(address)
	{
		paramsObj = {"address": address};
		bluetoothle.close(function(obj)	{ // close success
				if (obj.status == "closed")
				{
					console.log("Device " + obj.address + " closed");
				}
				else
				{
					console.log("Unexpected close status from device " + obj.address + ": " + obj.status);
				}
			}, 
			function(obj) { // close error
				console.log("Close error from device " + obj.address + ": " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.readTemperature = function(address, callback) {
		console.log("Read temperature at service " + generalServiceUuid + ' and characteristic ' + temperatureCharacteristicUuid);
		var paramsObj = {"address": address, "serviceUuid": generalServiceUuid, "characteristicUuid": temperatureCharacteristicUuid};
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var temperature = bluetoothle.encodedStringToBytes(obj.value);
					console.log("temperature: " + temperature[0]);

					callback(temperature[0]);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading temperature: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.scanDevices = function(address, scan) {
		var u8 = new Uint8Array(1);
		u8[0] = scan ? 1 : 0;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + indoorLocalisationServiceUuid + ' and characteristic ' + deviceScanUuid );
		var paramsObj = {"address": address, "serviceUuid": indoorLocalisationServiceUuid, "characteristicUuid": deviceScanUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to device scan characteristic - ' + obj.status);
				} else {
					console.log('Writing to device scan characteristic was not successful' + obj);
				}
			},
			function(obj) { // write error
				console.log("Error in writing device scan characteristic: " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.listDevices = function(address, callback) {
		console.log("Read device list at service " + indoorLocalisationServiceUuid + ' and characteristic ' + deviceListUuid );
		var paramsObj = {"address": address, "serviceUuid": indoorLocalisationServiceUuid, "characteristicUuid": deviceListUuid };
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var list = bluetoothle.encodedStringToBytes(obj.value);
					console.log("list: " + list[0]);

					callback(list);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading device list: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.writePWM = function(address, value) {
		var u8 = new Uint8Array(1);
		u8[0] = value;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + pwmUuid );
		var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": pwmUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to pwm characteristic - ' + obj.status);
				} else {
					console.log('Writing to pwm characteristic was not successful' + obj);
				}
			},
			function(obj) { // wrtie error
				console.log("Error in writing to pwm characteristic: " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.readCurrentConsumption = function(address, callback) {
		console.log("Read current consumption at service " + powerServiceUuid + ' and characteristic ' + currentConsumptionUuid);
		var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": currentConsumptionUuid};
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var currentConsumption = bluetoothle.encodedStringToBytes(obj.value);
					console.log("currentConsumption: " + currentConsumption[0]);

					callback(currentConsumption[0]);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading current consumption: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.sampleCurrent = function(address, value, callback) {
		var u8 = new Uint8Array(1);
		u8[0] = value;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + sampleCurrentUuid );
		var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": sampleCurrentUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to sample current characteristic - ' + obj.status);

					if (callback) {
						callback(true)
					}
				} else {
					console.log('Writing to sample current characteristic was not successful' + obj);

					if (callback) {
						callback(false)
					}
				}
			},
			function(obj) { // write error
				console.log("Error in writing to sample current characteristic: " + obj.error + " - " + obj.message);

				if (callback) {
					callback(false)
				}
			},
			paramsObj);
	}

	self.getCurrentCurve = function(address, callback) {
		console.log("Read current curve at service " + powerServiceUuid + ' and characteristic ' + currentCurveUuid );
		var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": currentCurveUuid };
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var result = bluetoothle.encodedStringToBytes(obj.value);

					// check type ??
					var length = result[1];
					if (length > 0) {
						callback(result);
					}
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			},
			function(obj) { // read error
				console.log('Error in reading current curve: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.writeDeviceName = function(address, value) {
		if (value != "") {
		var u8 = bluetoothle.stringToBytes(value);
		} else {
			var u8 = new Uint8Array(1);
			u8[0] = 0;
		}
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + generalServiceUuid + ' and characteristic ' + changeNameCharacteristicUuid );
		var paramsObj = {"address": address, "serviceUuid": generalServiceUuid, "characteristicUuid": changeNameCharacteristicUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to change name characteristic - ' + obj.status);
				} else {
					console.log('Writing to change name characteristic was not successful' + obj);
				}
			},
			function(obj) { // write error
				console.log("Error in writing to change name characteristic: " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.readDeviceName = function(address, callback) {
		console.log("Read device type at service " + generalServiceUuid + ' and characteristic ' + changeNameCharacteristicUuid );
		var paramsObj = {"address": address, "serviceUuid": generalServiceUuid, "characteristicUuid": changeNameCharacteristicUuid };
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var deviceName = bluetoothle.encodedStringToBytes(obj.value);
					var deviceNameStr = bluetoothle.bytesToString(deviceName);
					console.log("deviceName: " + deviceNameStr);

					callback(deviceNameStr);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading change name characteristic: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.writeDeviceType = function(address, value) {
		var u8 = bluetoothle.stringToBytes(value);
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + generalServiceUuid + ' and characteristic ' + deviceTypeUuid );
		var paramsObj = {"address": address, "serviceUuid": generalServiceUuid, "characteristicUuid": deviceTypeUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to device type characteristic - ' + obj.status);
				} else {
					console.log('Writing to device type characteristic was not successful' + obj);
				}
			},
			function(obj) { // write error
				console.log("Error in writing to device type characteristic: " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.readDeviceType = function(address, callback) {
		console.log("Read device type at service " + generalServiceUuid + ' and characteristic ' + deviceTypeUuid );
		var paramsObj = {"address": address, "serviceUuid": generalServiceUuid, "characteristicUuid": deviceTypeUuid };
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var deviceType = bluetoothle.encodedStringToBytes(obj.value);
					var deviceTypeStr = bluetoothle.bytesToString(deviceType);
					console.log("deviceType: " + deviceTypeStr);

					callback(deviceTypeStr);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading device type characteristic: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.writeRoom = function(address, value) {
		var u8 = bluetoothle.stringToBytes(value);
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + generalServiceUuid + ' and characteristic ' + roomUuid );
		var paramsObj = {"address": address, "serviceUuid": generalServiceUuid, "characteristicUuid": roomUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to room characteristic - ' + obj.status);
				} else {
					console.log('Writing to room characteristic was not successful' + obj);
				}
			},
			function(obj) { // write error
				console.log("Error in writing to room characteristic: " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.readRoom = function(address, callback) {
		console.log("Read room at service " + generalServiceUuid + ' and characteristic ' + roomUuid );
		var paramsObj = {"address": address, "serviceUuid": generalServiceUuid, "characteristicUuid": roomUuid };
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var room = bluetoothle.encodedStringToBytes(obj.value);
					var roomStr = bluetoothle.bytesToString(room);
					console.log("room: " + roomStr);

					callback(roomStr);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading room characteristic: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.writeCurrentLimit = function(address, value) {
		var u8 = new Uint8Array(1);
		u8[0] = value & 0xFF;
		// u8[1] = (value >> 8) & 0xFF;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + currentLimitUuid );
		var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": currentLimitUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to current limit characteristic - ' + obj.status);
				} else {
					console.log('Writing to current limit characteristic was not successful' + obj);
				}
			},
			function(obj) { // write errror
				console.log("Error in writing to current limit characteristic: " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.readCurrentLimit = function(address, callback) {
		console.log("Read current limit at service " + powerServiceUuid + ' and characteristic ' + currentLimitUuid );
		var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": currentLimitUuid };
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var currentLimit = bluetoothle.encodedStringToBytes(obj.value);
					console.log("current limit: " + currentLimit[0]);

					var value = currentLimit[0];

					callback(value);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading current limit characteristic: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.getTrackedDevices = function(address, callback) {
		console.log("Read device list at service " + indoorLocalisationServiceUuid + ' and characteristic ' + listTrackedDevicesUuid );
		var paramsObj = {"address": address, "serviceUuid": indoorLocalisationServiceUuid, "characteristicUuid": listTrackedDevicesUuid };
		bluetoothle.read(function(obj) { // read success
				if (obj.status == "read")
				{
					var list = bluetoothle.encodedStringToBytes(obj.value);
					console.log("list: " + list[0]);

					callback(list);
				}
				else
				{
					console.log("Unexpected read status: " + obj.status);
					self.disconnectDevice();
				}
			}, 
			function(obj) { // read error
				console.log('Error in reading tracked devices: ' + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

	self.addTrackedDevice = function(address, bt_address, rssi) {
		var u8 = new Uint8Array(7);
		for (var i = 0; i < 6; i++) {
			u8[i] = parseInt(bt_address[i], 16);
			console.log("i: " + u8[i]);
		}
		u8[6] = rssi;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + indoorLocalisationServiceUuid + ' and characteristic ' + addTrackedDeviceUuid );
		var paramsObj = {"address": address, "serviceUuid": indoorLocalisationServiceUuid, "characteristicUuid": addTrackedDeviceUuid , "value" : v};
		bluetoothle.write(function(obj) { // write success
				if (obj.status == 'written') {
					console.log('Successfully written to add tracked device characteristic - ' + obj.status);
				} else {
					console.log('Writing to add tracked device characteristic was not successful' + obj);
				}
			},
			function(obj) { // write error
				console.log("Error in writing to add tracked device characteristic: " + obj.error + " - " + obj.message);
			},
			paramsObj);
	}

}

