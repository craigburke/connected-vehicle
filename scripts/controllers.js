'use strict';

var CONST = {
	CMU_LOCATION : { lat: 40.4433, lng: -79.9436 },
	TRANSITION: { deltaCount: 100, delay: 10 }
};

var area = {
	accident: undefined,
	rain: undefined
};

var map;
var directionsService;
var cars = [{
		icon: 'images/car1.png', 
		name: 'Car 1',
		disabled: false,
		startLocation: 'Forbes Avenue and Euler Way Pittsburgh, PA',
		endLocation: 'S. Negley Ave and Fifth Ave Pittsburgh, PA',
		route: undefined,
		currentPosition: undefined,
		currentStep: 0,
		towardEnd: true,
		log: []
	},{	
		icon: 'images/car2.png', 
		name: 'Car 2', 
		disabled: false,
		startLocation: 'S. Negley Ave and Fifth Ave Pittsburgh, PA',
		endLocation: 'Forbes Avenue and Euler Way Pittsburgh, PA',
		route: undefined,
		currentPosition: undefined,
		currentStep: 0,
		towardEnd: true,
		log: []
},{	
		icon: 'images/car3.png', 
		name: 'Car 3', 
		disabled: false,
		startLocation: 'Forbes Avenue and Shenley Drive Pittsburgh, PA',
		endLocation: 'Centre Avenue and Bigelow Blvd Pittsburgh, PA',
		route: undefined,
		currentPosition: undefined,
		currentStep: 0,
		towardEnd: true,
		log: []
}];

function MainCtrl($scope) {
    directionsService = new google.maps.DirectionsService();
	
    var self = this;
	
	self.cars = cars;
	
	self.state = {
		play: true,
		rain: false,
		emergency: false
	};
	
	self.togglePlay = function() {
		self.state.play = !self.state.play;
	};
	
	self.toggleRain = function() {
		self.state.rain = !self.state.rain;
		if (self.state.rain) {
			area.rain.setMap(map); 		 
		}
		else {
			area.rain.setMap(null);
		}		
		
	};
	
	self.toggleAccident = function() {
		self.state.accident = !self.state.accident;
		if (self.state.accident) {
			area.accident.setMap(map); 		 
		}
		else {
			area.accident.setMap(null);
		}		
	};

	self.toggleDisableCar = function(car) {
		car.disabled = !car.disabled;
		if (car.disabled) {
			var message = {message: 'Disabled vehicle', date: new Date(), location: car.currentPosition, source: car.name};
			broadcastMessage(car, message);	
		}
	}

	map = setupMap();
	angular.forEach(self.cars, function(car) {
		setupCar(car, self.state, $scope);
	});
	
}

function logMessage(car, message) {
	var alreadyLogged = false
	
	angular.forEach(car.log, function(log) {
		if (log.message === message.message && log.location.lat() === message.location.lat() && log.location.lng() === message.location.lng()) {
			alreadyLogged = true;
		}
	});
	
	if (!alreadyLogged) {
		car.log.push(message);
	}
}

function broadcastMessage(car, message) {
	var broadcastMessage = {};
	angular.copy(message, broadcastMessage);
	broadcastMessage.source = car.name;
		
	angular.forEach(cars, function(car2) {
		if (car !== car2) {
			logMessage(car2, broadcastMessage);
		}
	});	
}


function setupCar(car, state, $scope) {
	
	var request = {
	      origin: car.startLocation,
	      destination: car.endLocation,
	      travelMode: google.maps.TravelMode.DRIVING
	  };

	  directionsService.route(request, function(response, status) {

	    if (status == google.maps.DirectionsStatus.OK) {
			car.route = response.routes[0].overview_path;
			car.currentPosition = car.route[0];
			animateCar(car, state, $scope);
	    }
	  });
}

function animateCar(car, state, $scope) {	
	var marker = new google.maps.Marker({
		position: car.currentPosition,
		icon: car.icon
	});
	
	marker.setMap(map);
		
	setInterval(function() {
		
		if (state.play && !car.disabled) {
			if (!car.towardEnd && car.currentStep === 0) {
				car.towardEnd = true;
				car.currentStep = 1;
			}
			else if (car.towardEnd && car.currentStep === (car.route.length - 1)) {
				car.towardEnd = false;
				car.currentStep--;
			}
			else {
				car.currentStep = car.currentStep + (car.towardEnd ? 1 : -1);
			}
			
			transitionToPosition(car, marker, car.route[car.currentStep]);
			$scope.$apply(function() {
				updateData(car, state)
			})
			
		}
	}, 1000);	
}

function updateData(car, state) {
	var message = undefined;
	
	if (state.accident && area.accident.getBounds().contains(car.currentPosition)) {
		message = {message: "Accident", location: area.accident.getCenter(), date: new Date(), source: 'Transmitter'}
		logMessage(car, message);
	}
	if (state.rain && area.rain.getBounds().contains(car.currentPosition)) {
		message = {message: "Rain", location: area.rain.getCenter(), date: new Date(), source: car.name};
	}
	
	if (message) {
		broadcastMessage(car, message);
	}
}

function transitionToPosition(car, marker, newPosition) {
	var latitudeDelta = (newPosition.lat() - car.currentPosition.lat()) / CONST.TRANSITION.deltaCount;
	var longitudeDelta = (newPosition.lng() - car.currentPosition.lng()) / CONST.TRANSITION.deltaCount;

	changePosition(car, marker, latitudeDelta, longitudeDelta, 0)
}

function changePosition(car, marker, latitudeDelta, longitudeDelta, deltaCount) {
	var currentPosition = marker.getPosition();
	
    var newPosition = new google.maps.LatLng(currentPosition.lat() + latitudeDelta, currentPosition.lng() + longitudeDelta);
	car.currentPosition = newPosition;
	marker.setPosition(newPosition);
	
	if (deltaCount < CONST.TRANSITION.deltaCount) {
		setTimeout(function() {
			changePosition(car, marker, latitudeDelta, longitudeDelta, deltaCount + 1);
		}, CONST.TRANSITION.delay);
	} 
}


function setupMap() {

	area.accident = new google.maps.Circle({
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#FF0000',
		fillOpacity: 0.35,
		map: null,
		center: CONST.CMU_LOCATION,
		radius: 300,
		draggable: true
	  });
	
	
  	area.rain = new google.maps.Circle({
  		strokeColor: '#236B8E',
  		strokeOpacity: 0.8,
  		strokeWeight: 2,
  		fillColor: '#009ACD',
  		fillOpacity: 0.35,
  		map: null,
  		center: CONST.CMU_LOCATION,
  		radius: 500,
  		draggable: true
  	  });
	
	var mapOptions = {
		center: CONST.CMU_LOCATION,
		zoom: 15,
		disableDefaultUI: true,
		draggable: false,
		zoomControl: false,
		scrollwheel: false,
		disableDoubleClickZoom: true
    };
	
    return new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}


angular.module('carApp.controllers', [])
    .controller('MainCtrl', MainCtrl)
