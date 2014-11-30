'use strict';

var CMU_LOCATION = { lat: 40.4433, lng: -79.9436 };
var TRANSITION = {
	deltaCount: 100,
	delay: 10
};

var area = {
	accident: undefined,
	rain: undefined
};

var map;
var directionsService;
var cars = [{
		id: 'car1',
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
		id: 'car2',
		name: 'Car 2', 
		disabled: false,
		startLocation: 'S. Negley Ave and Fifth Ave Pittsburgh, PA',
		endLocation: 'Forbes Avenue and Euler Way Pittsburgh, PA',
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

	self.crash = function(car) {
		car.disabled = true;
	}

	map = setupMap();
	angular.forEach(self.cars, function(car) {
		setupCar(car, self.state, $scope);
	});
	
}

function logMessage(car, message) {
	var alreadyLogged = false
	
	angular.forEach(car.log, function(log) {
		if (log.message === message.message && log.location === message.location) {
			alreadyLogged = true;
		}
	});
	
	if (!alreadyLogged) {
		car.log.push(message);
	}
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
		icon: 'images/car.png'
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
	
	if (state.accident && area.accident.getBounds().contains(car.currentPosition)) {
		logMessage(car, {message: "Accident", location: area.accident.getCenter(), date: new Date(), source: 'Infrastructure Transmitter'});
	}
	if (state.rain && area.rain.getBounds().contains(car.currentPosition)) {
		
		angular.forEach(cars, function(car2) {
			if (car !== car2) {
				logMessage(car2, {message: "Rain", location: area.rain.getCenter(), date: new Date(), source: car.name});
			}
		});
	}
	
}

function transitionToPosition(car, marker, newPosition) {
	var latitudeDelta = (newPosition.lat() - car.currentPosition.lat()) / TRANSITION.deltaCount;
	var longitudeDelta = (newPosition.lng() - car.currentPosition.lng()) / TRANSITION.deltaCount;

	changePosition(car, marker, latitudeDelta, longitudeDelta, 0)
}

function changePosition(car, marker, latitudeDelta, longitudeDelta, deltaCount) {
	var currentPosition = marker.getPosition();
	
    var newPosition = new google.maps.LatLng(currentPosition.lat() + latitudeDelta, currentPosition.lng() + longitudeDelta);
	car.currentPosition = newPosition;
	marker.setPosition(newPosition);
	
	if (deltaCount < TRANSITION.deltaCount) {
		setTimeout(function() {
			changePosition(car, marker, latitudeDelta, longitudeDelta, deltaCount + 1);
		}, TRANSITION.delay);
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
		center: CMU_LOCATION,
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
  		center: CMU_LOCATION,
  		radius: 300,
  		draggable: true
  	  });
	
	var mapOptions = {
		center: CMU_LOCATION,
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
