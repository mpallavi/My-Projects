
	// This is a custom function that WE wrote to add to a MAP, a marker with a TITLE at a certain LAT/LNG
	function addMarker(map,title,lat,lng) {
		// Create options for a new map marker:
		var markerOptions = {
			position: new google.maps.LatLng(lat,lng)
			, title:title
			, map: map
		};
		// Create the marker (adds to the map because of the 'map' option):
		var marker = new google.maps.Marker(markerOptions);
		// A new instance is being created and thus needs data to form an object
		return marker;
	}

	function clearMarkers() {
		// Loop through my 'markers' in the same way that I did before (even though they're from a different source now)
		// This loop wipes out any markers already stored in the map and clears them out of storage
		while(window.map.markers.length>0) {
			window.map.markers[0].setMap(null);
			window.map.markers.shift();
		}
	}
	
	function drawMarkers(state) {
		// Call up the appropriate [state].txt file using the ajax() function:
		var json = ajax(state+".txt");
		// Parse that JSON into an array of 'markers' using a custom parseJSON function:
		var data = parseJSON(json);
		//A new instance with map data (latitude and longitude) is created
		window.map.setCenter(new google.maps.LatLng(data.lat,data.lng));
		// Default zoom level is kept to 13
		window.map.setZoom(13);
		// This loop runs through the data that we just retrieved , and adds a new  marker for each one
		for (var i=0;i<data.markers.length;i++) {
			// Create the Google Map marker using the marker's date (title, lat, lng)
			var marker = addMarker(window.map,data.markers[i].title,data.markers[i].lat,data.markers[i].lng);
			// Add that marker to our running list of markers on our map
			window.map.markers.push(marker);
			// Prepare an info window to use with the marker
			var infowindowOptions = {
				content: "<strong>" + data.markers[i].title + "</strong><hr />" + data.markers[i].info
				,
				position: new google.maps.LatLng(data.markers[i].lat, data.markers[i].lng)
				,
				maxWidth: 300
			};
			// Creates new instance of this class
			marker.infowindow = new google.maps.InfoWindow(infowindowOptions);
			// Add a listener to open that info window whenever the marker is clicked
			google.maps.event.addListener(marker, 'click', function() {
				// Anchor info to the pin so that it adjusts the location. In other words, anchor 'this' info on the marker ('this' being the info from google.maps.event.addListener- where it is listening)
				// Make an info window pop up 
				this.infowindow.open(window.map, this);
			});	
		}
	}
	
	// This is a function that WE wrote to initially draw our map and do a few things (like add some pins) once the page loads
	function drawMap() {
		// Set up some minimal options ('center' and 'zoom') that Google expects to see for a map
		//These are built into an object (using JSON)
        var mapOptions = {
          center: new google.maps.LatLng(36.06854219959001,-79.80560102179567)
		  , zoom: 5
        };
		// We feed those options, along with DIV to draw the map in, to the Map function:
        window.map = new google.maps.Map( document.getElementById("map-canvas") , mapOptions );
		// Creating a list of array of places to pass on to function when called
		window.map.markers = [];
		// Grab data from external source (using Ajax) and Then parse it and loop through it:
		document.getElementById('btn-draw-markers').onclick = function() { 
			var state = document.getElementById('select-state').value;
			drawMarkers(state);
		}
	}
	// Tells our window to call 'drawmap' functions once the window loads
	google.maps.event.addDomListener(window, 'load', drawMap);
