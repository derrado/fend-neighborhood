function toggleMenu(x) {
    x.classList.toggle("change");
}

var map,
    largeInfowindow,
    bounds,
    vm;

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

    // Bind the ViewModel to KnockOut
    ko.applyBindings(vm);
};

// Define a Venue class - contains everything a Venue needs, including the marker
// Influenced by http://knockoutjs.com/examples/collections.html and the other examples there
var Venue = function(data) {
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);
    this.fsId = data.fsId;

    // Create a marker for the Venue
    this.marker = new google.maps.Marker({
        position: this.position(),
        title: this.title(),
        animation: google.maps.Animation.DROP,
    })
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
            // Set the focus on the marker
            self.setFocusOnMarker(venue);
        })
    });

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

    // Set the focus on the marker
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


// Pull the content for the InfoWindow from external resource
function getContentForInfoWindow(venue, infowindow) {
    var clientId = "C2Y3OJMWBBAPD45GP4SHCMXR3VARCWC4TYPOFAFX0SZL1TSQ";
    var clientSecret = "QW3YUXFTRNLFBUG5VS50R1S3ERXLGEKPLJ3IJ2CEGR3RFU41";
    var params = {client_id: clientId, client_secret: clientSecret, v: '20170813', m: 'foursquare'};
    var url = 'https://api.foursquare.com/v2/venues/' + venue.fsId + '?' + $.param(params);

    $.ajax({
        url: url,
        dataType: 'json',
        success: function (data) {
            parseExternalContent(venue, data.response.venue);
        },
        error: function (xhr) {
            infowindow.setContent('There was an error with your request.');
        }
    });
}

// Parse the submitted data into a nice format for the infowindow
function parseExternalContent(venue, data) {
    let ret = '';
    ret += '<h1>' + venue.title() + '</h1>';
    ret += '<p><small>Showing address data from FourSquare</small></p><hr>';
    data.location.formattedAddress.forEach(function(entry) {
        ret += entry + '<br>';
    });
    largeInfowindow.setContent(ret);
}
