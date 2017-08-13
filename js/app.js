function toggleMenu(x) {
    x.classList.toggle("change");
}

var map,
    largeInfowindow,
    bounds,
    vm;
    // markers = [];


function initMap() {

    // Define the map options (center on the first location)
    var mapOptions = { center: locations[0].position, zoom: 13, mapTypeControl: false };

    // Construct a new Map and pass the options
    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    // Construct a new Boundary
    bounds = new google.maps.LatLngBounds();

    // Construct a new InfoWindow
    largeInfowindow = new google.maps.InfoWindow();

    // Construct a new ViewModel
    vm = new ViewModel();

    // Zoom and Center map to fit all Markers
    // map.fitBounds(bounds);

    // Bind the ViewModel to KnockOut
    ko.applyBindings(vm);
};

// Define a Venue class - contains everything a Venue needs, including the marker
// Influenced by http://knockoutjs.com/examples/collections.html and the other examples there
var Venue = function(data) {
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);

    // Create a marker for the Venue
    this.marker = new google.maps.Marker({
        position: this.position(),
        title: this.title(),
        animation: google.maps.Animation.DROP,
    })

    // Put the newly created marker into markers array
    // markers.push(this.marker);
};

var ViewModel = function() {
    var self = this;

    self.staticVenues = [];
    self.visibleVenues = ko.observableArray([]);
    self.filter = ko.observable('');

    // Iterate once through all locations and create a new Venue out of each
    // Influenced by http://knockoutjs.com/examples/collections.html and the other examples there
    locations.forEach(function(location) {
        // Create new Venue
        let venue = new Venue(location);

        // Push the Venue into the staticVenues container
        self.staticVenues.push(venue);

        // Create a click-listener for the marker
        venue.marker.addListener('click', function() {
            // Open InfoWindow on click
            self.displayInfoWindow(venue, largeInfowindow);
        })
    });


    // // Create an onclick event to open an infowindow at each marker.
    // this.marker.addListener('click', function() {
    //     vm.displayInfoWindow(this, largeInfowindow);
    // });

    // /* Adding event listener to the markers when clicked on the markers directly */
    // self.addClickListener = function () {
    //     for (var i = 0; i< self.markerContainer().length; i++) {
    //         /* Adding event listener to each of the marker */
    //         self.markerContainer()[i].addListener('click', self.activateMarker);
    //         bounds.extend(self.markerContainer()[i].position);
    //     }
    // };


    // Toggles the visibility of the markers on the map
    // Influenced by Google-Docs: https://developers.google.com/maps/documentation/javascript/examples/marker-remove
    self.toggleMarkersOnMap = function () {
        // We are looping through all static venues here
        self.staticVenues.forEach(function(venue) {
            // Match the visible/filtered Venues against the static Venues
            if (self.visibleVenues().indexOf(venue) !== -1) {
                // The venue is visible, display the marker on the map
                venue.marker.setMap(map);
                // Extend the boundariy
                bounds.extend(venue.marker.position);
            } else {
                // Venue is not visible, no need to display the marker
                venue.marker.setMap(null);
            };
        });

        // Zoom and Center map to fit all Markers
        map.fitBounds(bounds);
    };

    // Set the focus on the marker after it was clicked in the list
    // Note: We are also opening the info windows according to the rubric here
    self.setFocusOnMarker = function(venue) {
        // Set the clicked marker into a var for a little less typing
        let mk = venue.marker;

        // Center the map on the marker
        map.panTo(mk.getPosition());

        // Animate the marker
        mk.setAnimation(google.maps.Animation.BOUNCE);

        // Display the InfoWindow
        self.displayInfoWindow(venue, largeInfowindow);

        // Set a timeout to stop the marker after 750ms, which is roughly one full bounce animation
        setTimeout(function(){ mk.setAnimation(null); }, 750);
    }

    // Display the InfoWindow
    // Mostly taken from google-docs and the udacity-course
    self.displayInfoWindow = function(venue, infowindow) {
        // Set the clicked marker into a var for a little less typing
        let mk = venue.marker;

        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != mk) {
            infowindow.marker = mk;

            // Set a placeholder while fetching the real content
            infowindow.setContent('Fetching data, just a second...');
            // Open the InfoWindow at the marker
            infowindow.open(map, mk);

            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });

            // Fetch the content
            getContentForInfoWindow(venue, largeInfowindow)
        }
    }




    // Filter the visibleVenues according to the User-Input in the search box
    self.filterVenues = ko.computed(function() {
        var filter = self.filter()

        // Empty the visible Venues
        self.visibleVenues.removeAll();

        // Filter user-input and put results into a new variable
        let arr = self.staticVenues.filter(function(i) { return i.title().indexOf(filter) > -1; });

        // Populate the visibleVenues again with the filtered results
        arr.forEach(function(a) {
            self.visibleVenues.push(a);
        });

        // Toggle the markers
        self.toggleMarkersOnMap(map);
    });
};

    // The following group uses the location array to create an array of markers on initialize.
    // for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        // var position = locations[i].position;
        // var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        // var marker = new google.maps.Marker({
        // });
    // }

    // document.getElementById('show-listings').addEventListener('click', showListings);
    // document.getElementById('hide-listings').addEventListener('click', hideListings);

    // Call the functions which shows all Markers
    // showListings();
// }

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        // Set a placeholder while fetching the real content
        infowindow.setContent(getContentForInfoWindow(marker.id));
        // Open the InfoWindow at the marker
        infowindow.open(map, marker);

        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        // Fetch the content
        getContentForInfoWindow(marker.id)
    }
}

// This function will loop through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();

    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}


function bounceAndCenterMarker(id) {
    if (markers[id].getAnimation() !== null) {
        return;
    }

    map.panTo(markers[id].getPosition());
    markers[id].setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ markers[id].setAnimation(null); }, 750);
}

// Pull the content for the InfoWindow from external Resource

function getContentForInfoWindow(venue, infowindow) {
    console.log('getContentForInfoWindow called with ' + venue.title());
    console.log('need to update this with a REAL external api');

    let content = '<div id="content">'+
                    '<div id="siteNotice">'+
                    '</div>'+
                    '<h1 id="firstHeading" class="firstHeading">Uluru</h1>'+
                    '<div id="bodyContent">'+
                    '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
                    'sandstone rock formation in the southern part of the '+
                    'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
                    'south west of the nearest large town, Alice Springs; 450&#160;km '+
                    '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
                    'features of the Uluru - Kata Tjuta National Park. Uluru is '+
                    'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
                    'Aboriginal people of the area. It has many springs, waterholes, '+
                    'rock caves and ancient paintings. Uluru is listed as a World '+
                    'Heritage Site.</p>'+
                    '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
                    'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
                    '(last visited June 22, 2009).</p>'+
                    '</div>'+
                    '</div>';

    infowindow.setContent(content);
};