var CMU_LOCATION = { lat: 40.4433, lng: -79.9436 };
var TRANSITION = {
	deltaCount: 100,
	delay: 10
}

var cars = [
	{	
		id: 'car1',
		name: 'Car 1', 
		startLocation: 'Forbes Avenue and Euler Way Pittsburgh, PA',
		endLocation: 'S. Negley Ave and Fifth Ave Pittsburgh, PA',
		route: undefined,
		currentPosition: undefined,
		currentStep: 0,
		towardEnd: true
	},
	{	
		id: 'car2',
		name: 'Car 2', 
		startLocation: 'S. Negley Ave and Fifth Ave Pittsburgh, PA',
		endLocation: 'Forbes Avenue and Euler Way Pittsburgh, PA',
		route: undefined,
		currentPosition: undefined,
		currentStep: 0,
		towardEnd: true
	}
]

var state = {
	play: true,
	rain: false,
	emergency: false
}

var map;
var directionsService;

function initialize() {
    directionsService = new google.maps.DirectionsService();
	
	map = setupMap();
	wireButtons();
	
    for (var i = 0; i < cars.length; i++) {
		var car = cars[i];
		
		setupCar(car);
	}
}

function wireButtons() {
	$("#play").click(function() {
		if (state.play) {
			$("#play .play").show();
			$("#play .pause").hide();
		}
		else {
			$("#play .play").hide();
			$("#play .pause").show();
		}
		
		state.play = !state.play;
	});	
	
    var warningCircle = new google.maps.Circle({
		strokeColor: '#fcf8e3',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#faebcc',
		fillOpacity: 0.35,
		map: null,
		center: CMU_LOCATION,
		radius: 500
    });
   
	var alertCircle = new google.maps.Circle({
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#FF0000',
		fillOpacity: 0.35,
		map: null,
		center: CMU_LOCATION,
		radius: 300
	  });
	  
	$("#emergency").click(function() {	
		state.emergency = !state.emergency;
		
		if (state.emergency) {
			warningCircle.setMap(map);
			alertCircle.setMap(map); 		 
			$(this).addClass('active');
		}
		else {
			warningCircle.setMap(null);
			alertCircle.setMap(null);
			$(this).removeClass('active');
		}

	});
	
	$("#rain").click(function() {
		state.rain = !state.rain;

		if (state.rain) {
			$(this).addClass('active');
		}
		else {
			$(this).removeClass('active');
		}
		
	})
}


function setupMap() {
	var options = {
		center: CMU_LOCATION,
		zoom: 15,
		disableDefaultUI: true,
		draggable: false,
		zoomControl: false,
		scrollwheel: false,
		disableDoubleClickZoom: true
    };
	
    return new google.maps.Map(document.getElementById('map-canvas'), options);
}

function animateCar(car) {	
	var marker = new google.maps.Marker({
		position: car.currentPosition,
		title:"Hello World!",
		icon: 'images/car.png'
	});
	
	marker.setMap(map);
	
	setInterval(function() {
		
		if (state.play) {
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
			updateData();
		}
	}, 1000);
	
}

function updateData() {
    for (var i = 0; i < cars.length; i++) {
		var car = cars[i];
		var html = "Latitude: " + car.currentPosition.lat() + "<br />";
		html += "Longitude: " + car.currentPosition.lng() + "<br />";		
		
		$("#" + car.id + ' .data').html(html);
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


function setupCar(car, map) {
	
	var request = {
	      origin: car.startLocation,
	      destination: car.endLocation,
	      travelMode: google.maps.TravelMode.DRIVING
	  };

	  directionsService.route(request, function(response, status) {

	    if (status == google.maps.DirectionsStatus.OK) {
			car.route = response.routes[0].overview_path;
			car.currentPosition = car.route[0];
			animateCar(car);
	    }
	  });
}


google.maps.event.addDomListener(window, 'load', initialize);