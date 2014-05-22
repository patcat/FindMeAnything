var locationOptions = {timeout: 15000, maximumAge: 60000},
    searchingFor = window.localStorage.getItem('searchingFor') ? window.localStorage.getItem('searchingFor') : 'Starbucks'; 

function fetch_location_data(pos) {
  var req = new XMLHttpRequest(),
  	  version = Date.now(),
  	  clientId = 'BSFRMG541RT1SJBWRZ4NPV1F5QQKJ2B1OSMQ0EDTU3NR0ZAX',
  	  clientSecret = '4VFLSBVYEQAN0M0XNGERON0LYMSMG1AJRSXXAQURK5GJQBNB',
  	  latitude = pos.coords.latitude,
  	  longitude = pos.coords.longitude;

  req.open('GET', 'https://api.foursquare.com/v2/venues/search?client_id='+clientId+'&client_secret='+clientSecret+'&v='+version+'&ll='+latitude+','+longitude+'&query='+searchingFor, true);
  
  req.onload = function(e) {
  	if (req.readyState == 4 && req.status == 200) {
      if (req.status == 200) {
        var response = JSON.parse(req.responseText);
        
        if (response && response.meta.code == '200' && response.response) {
          var venues = response.response.venues,
              venue = undefined,
              venueIndex = 0;

          // Look for the first instance of a venue with an address
          while (venues[venueIndex] !== undefined && venue === undefined) {
            if (venues[venueIndex] && venues[venueIndex].location.address !== undefined && venues[venueIndex].location.city !== undefined) {
              venue = venues[venueIndex];
            }

            venueIndex++;
          }

          if (venue && venue.location.address !== undefined && venue.location.city !== undefined) {
            Pebble.sendAppMessage({
              location: venue.location.address + ', ' + venue.location.city,
              searchingFor: 'Nearest ' + decodeURIComponent(searchingFor) + ':'
            });
            console.log('Found '+venue.location.address + ', ' + venue.location.city);
          } else {
            Pebble.sendAppMessage({
              location: 'No ' + decodeURIComponent(searchingFor) + ' found',
              searchingFor: 'Nearest ' + decodeURIComponent(searchingFor) + ':'
            });
          }
        }
      } else {
      	console.log('Error');
      }
    }
  }
  req.send(null);
}

function fetch_location_error(err) {
  console.log(err);
  Pebble.sendAppMessage({location: 'Unable to retrieve location'});
}

Pebble.addEventListener('ready', function(e) {
  locationWatcher = window.navigator.geolocation.watchPosition(fetch_location_data, fetch_location_error, locationOptions);
});

Pebble.addEventListener('showConfiguration', function() {
  Pebble.openURL('http://www.patrickcatanzariti.com/find_me_anything/configurable.html?searchingFor=' + searchingFor);
});

Pebble.addEventListener('webviewclosed', function(e) {
  var options = JSON.parse(decodeURIComponent(e.response));
  searchingFor = encodeURIComponent(options.searchingFor);

  if (searchingFor == 'undefined') {
    searchingFor = 'Starbucks';
  }
  window.localStorage.setItem('searchingFor', searchingFor);
  locationWatcher = window.navigator.geolocation.watchPosition(fetch_location_data, fetch_location_error, locationOptions);
});