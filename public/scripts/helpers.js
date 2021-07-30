// helper functions that can get called by any script

$(() => {
  window.map = L.map('map', {
    center: [48.42959706075791, -123.34509764072138],
    zoom: 13
  })
  L.tileLayer('https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=4Z6KRmYugsIBUnw1Jpiy', {
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  }).addTo(map);
});

const userIsLoggedIn = () => {
  // if the current user has a username, which means this user is updated from getUser();
  if (window.user.username) {
    return true;
  }
  return false;
};

/* get current logged in user object from the users table and set it to global variable
which includes id, username, password, latitue, longitude */
const getUser = () => {
  $.get('/api/users/me', (obj) => {
    window.user = obj;
    console.log('logged in user is:', window.user);
  });
};

const makeUserPin = (lat, long, content) => {
const latlng = L.latLng(lat, long);
const myIcon = L.icon({
  iconUrl: src='/images/poop.png',
  iconSize: [38, 38],
  iconAnchor: [20, 20],
  popupAnchor: [0, -15]
});
  const marker = L.marker(latlng, { icon: myIcon }).addTo(window.map);
  const popup = L.popup().setContent(content);
  marker.bindPopup(popup).openPopup();
  map.panTo([lat, long], 15);
};

const updateUserLocation = () => {
  window.map.locate({ setView: true, maxZoom: 15 })
  .on('locationfound', function(e) {
    window.user.latitude = e.latitude;
    window.user.longitude = e.longitude;
    const radius = e.accuracy / 2;
    makeUserPin(e.latitude, e.longitude, `<p>That's you!</p>`);
    L.circle(e.latlng, radius).addTo(window.map);
    if (userIsLoggedIn()) {
      setUserLocation(window.user);
    }
  })
  // if location not found or blocked
  .on('locationerror', function(e) {
    console.log('location blocked, user lat:', window.user.latitude, 'long:', window.user.longitude);
    if (userIsLoggedIn()) {
      makeUserPin(window.user.latitude, window.user.longitude, `<p>Your last location was here</p>`);
    } else {
      makeUserPin(window.user.latitude, window.user.longitude, `<p>No location found, default to Vancouver City Hall</p>`);
    }
  });
};

// patch via ajax current logged in user latitude and longitude in the users table
const setUserLocation = (user) => {
  $.ajax({
    url: `http://localhost:8080/api/users/${user.id}`,
    type: 'PATCH',
    data: { latitude: user.latitude, longitude: user.longitude },
    success: function () {
      console.log(`user location Successfully Patched! user lat: ${user.latitude}, user long:${user.longitude}`);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      // log the error to the console
      console.log("The following error occured: " + textStatus, errorThrown);
    },
    complete: function () {
      console.log("Patching completed");
    }
  })
};

const userLocation = function() {
  const userCoords = [window.user.latitude, window.user.longitude];
  return userCoords

  // $.get('/api/users/', (obj) => {
  //   const user_id = obj.user_id;
  //   $.get(`/api/users/${user_id}/location`, (obj) => {
  //     const location = [obj.userData[0].latitude, obj.userData[0].longitude];
  //     console.log("location in func: ", location);
  //   })
  // });
};

const userDistance = (location) => {return Math.round(map.distance(userLocation(), location))};
