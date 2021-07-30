// define a default user location at Vancouver
window.user = { latitude: 49.260833, longitude: -123.113889 };

$(document).ready(function () {
  const makeUserPin = (lat, long, content) => {
    const latlng = L.latLng(lat, long);
    const myIcon = L.icon({
      iconUrl: src = '/images/poop.png',
      iconSize: [38, 38],
      iconAnchor: [20, 20],
      popupAnchor: [0, -15]
    });
    const marker = L.marker(latlng, { icon: myIcon }).addTo(window.map);
    const popup = L.popup().setContent(content);
    marker.bindPopup(popup).openPopup();
    map.flyTo([lat, long], 15);
  };

  const updateUserLocation = () => {
    window.map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true })
      .on('locationfound', function (e) {
        window.user.latitude = e.latitude;
        window.user.longitude = e.longitude;
        const radius = e.accuracy / 2;
        makeUserPin(e.latitude, e.longitude, `<p>You are within ${radius} meters from this point</p>`);
        L.circle(e.latlng, radius).addTo(window.map);
        if (userIsLoggedIn()) {
          setUserLocation(window.user);
        }
      })
      // if location not found or blocked
      .on('locationerror', function (e) {
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

  const getMapNearUserLocation = () => {
    console.log(window.user);
    $.get(`/api/maps/${window.user.latitude}/${window.user.longitude}`, (obj) => {
      console.log('map obj according to location', obj.maps);
      const mapDiv = $('.mapButtons')
      mapDiv.empty();
      for (let i = 0; i < obj.maps.length; i++) {
        const map_name = obj.maps[i].name;
        const map_id = obj.maps[i].id;
        const mapButton = $(`<div>${map_name}</div><br>`);
        $(mapButton).attr('id', `${map_id}`);
        mapButton.addClass('map-button');
        mapButton.appendTo(mapDiv);
      }
    });
  };

  const renderPins = (map) => {
    const map_id = map.id;
    const map_name = map.name;
    const $sidebar = $('.sidebar');
    $sidebar.empty();
    //get pin buttons from maps
    $.get(`/api/mapPins/${map_id}`, (obj) => {
      const $h3 = $(`<div class='pins-container'><h3>Pins for ${map_name}</h3></div><br>`);
      $h3.appendTo($sidebar);
      for (let i = 0; i < obj.length; i++) {
        const { id, title, latitude, longitude } = obj[i];
        const distance = userDistance([latitude, longitude]);
        const ids = id.toString() + "-" + map_id.toString();
        console.log("id to string", ids);
        const pinButton = $(`<div class='pinButtons'><div>${title}</div> ${distance}m away </div>`);
        const deleteButton = $(`<div class="deleteButtons">delete</div><br><br>`);
        console.log('pinButton', pinButton);
        $(pinButton).attr('id', id);
        $(deleteButton).attr('id', ids);
        pinButton.appendTo($h3);
        deleteButton.appendTo($h3);
      }
    })
      .then(() => {
        // make create pin button
        const $createPin = $(`<div><button class="createPin" id="${map_id}">create pin</button></div>`);
        $createPin.appendTo($('.pins-container'));
        const $backButton = $('</br><button>back</button>')
        $backButton.appendTo($('.sidebar'))
        $($backButton).on('click', function () {
          renderNav();
          getAllPins();
        });
      })
  };

  // deleting specific pin
  $('.sidebar').on('click', '.deleteButtons', function() {
    const id = $(this).attr('id'); // pin_id,map_id
    const $this =  $(this);
    console.log($this);
    const ids = id.split('-');
    const pin_id = ids[0];
    const map_id = ids[1];
    console.log('pins', pin_id, map_id)
    //post returns updated map_id without pins
    $.ajax({
      url: `/api/mapPins/${pin_id}/${map_id}`,
      type: 'DELETE',
      success: function(result) {
        console.log('button deleted');
        $.get(`/api/maps/${map_id}`, (obj) => {
        console.log('after deleting relationship got:', obj.maps[0]);
        renderPins(obj.maps[0]);
        });
      }
    });
  });

  // clicking any map button
  $('.sidebar').on('click', '.map-button', function() {
    // remove all the user defined map layers on map
    map.eachLayer(function (layer) {
      if (layer.map_id) {
        map.removeLayer(layer);
      }
    });
    if (window.allPins) {
      map.removeLayer(window.allPins);
    }

    const buttonID = $(this).attr('id');
    console.log("button ID = " + buttonID);

    $.getJSON(`http://localhost:8080/api/maps/${buttonID}`, function (result) {
      console.log('result', result);
      const map_id = result.maps[0].id;
      const map_lat = result.maps[0].latitude;
      const map_long = result.maps[0].longitude;
      const map_name = result.maps[0].name;

      window.mapLayers.eachLayer(function (layer) {
        if (layer.map_id === map_id) {
          layer.addTo(map);
        }
      });
      map.flyTo([map_lat, map_long], 15);
      const $sidebar = $('.sidebar');
      $sidebar.empty();

      renderPins(result.maps[0]);

      $('.sidebar').on('click', '.pinButtons', function () {
        const buttonID = $(this).attr('id');
        console.log('pin button clicked id:', buttonID);
        $.getJSON(`http://localhost:8080/api/pins/${buttonID}`, function (result) {
          console.log('result', result);
          const pin = result.pins[0];
          const pin_lat = pin.latitude;
          const pin_long = pin.longitude;
          map.flyTo([pin_lat, pin_long], 17);
          window.mapLayers.eachLayer(function (layer) {
            layer.eachLayer(function (marker) {
              if (marker.pin_id == buttonID) {
                console.log('found a match, pin:', marker.pin_id);
                marker.openPopup();

                // refactor into a function
                const $title = $('<header>', {'class': 'pin_title'}).text(pin.title);
                const $img = $('<img>', {'class': 'image'}).attr('src', pin.image_url);
                const $description = $('<p>', { 'class': 'write_up'}).text(pin.description);
                const $descriptionDiv = $('<div>', { 'class': 'description'});
                const $nav = $('<nav>', {'class': 'pin_bar'});
                const $footer = $('<footer>');
                const $rateButton = $('<button>', {'class': 'edit_pin'}).text('Rate Bathroom');
                const $editButton = $('<button>', {'class': 'edit_pin'}).text('edit pin').attr('hidden', true);
                const $addButton = $('<button>', {'class': 'add_pin'}).attr('hidden', true).text('report pin');
                $descriptionDiv.append($img, $description);
                $footer.append($rateButton, $editButton, $addButton);
                $nav.append($title, $descriptionDiv, $footer);
                $('div.pin_container').empty();
                $('div.pin_container').append($nav);
                $('div.pin_details').addClass('left_side') //animate this
                $('.toggle_button').removeClass('toggle_open').addClass('toggle_close')
              }
            });
          });
        })
      })
    })
  });


  const renderNavLoggedIn = () => {
    const user_id = window.user.id;
    $('.sidebar').empty();
    const $userMaps = $(`<header>user not logged in</header>
      <div>
        <h3>User Maps</h3>
        <div class='mapButtons'></div>
      </div>`);
    $userMaps.appendTo($('.sidebar'));
    $.get(`/api/users/${user_id}`, (obj) => {
      console.log(`user ${user_id}`, obj);
      console.log(`username`, obj.userData[0].username);
      username = obj.userData[0].username;

      // update sidebar username
      $(".sidebar header").text(`user: ${username}`);

      // make create map button
      const $createButton = $('<footer><button class="createMap">create map</button></footer>');
      $createButton.appendTo($('.sidebar'));

      const mapDiv = $(".mapButtons");

      for (let i = 0; i < obj.userData.length; i++) {
        const map_name = obj.userData[i].map_name;
        const map_id = obj.userData[i].map_id;
        const $mapButton = $(`<div>${map_name}</div><br>`);
        $($mapButton).attr('id', `${map_id}`);
        $mapButton.addClass('map-button');
        // console.log('map button:', mapButton);
        // console.log('map button id', mapButton.attr('id'));
        $mapButton.appendTo(mapDiv);
      }
    });

    // create map form
    const $form = $(`<form>
          <input type="hidden" name="creator_id" value="${user_id}" />

          <label for="name">Map name:</label><br><br>
          <input type="text" name="name" id="name" placeholder="Map Name" /><br><br>

          <label for="latitude">Latitude:</label><br><br>
          <input type="text" name="latitude" id="latitude" placeholder="49.260833" /><br><br>

          <label for="longitude">Longitude:</label><br><br>
          <input type="text" name="longitude" id="longitude" placeholder="-123.113889" /><br><br>
          <span></span> <br><br>
          <button type="submit" id="submitButton" value="Submit">submit</button>
          <button type="button" id="cancelButton">Cancel</button>
        </form> `);

    $('.sidebar').on('click', '.createMap', function () {
      const $sidebar = $('.sidebar');
      $sidebar.empty();
      $form.appendTo($sidebar);
    });

    // form submit button
    $form.submit((event) => {
      event.preventDefault();
      if ($.trim($("#name").val()) === "" || $.trim($("#latitude").val()) === "" || $.trim($("#longitude").val()) === "") {
        return $("span").text("One of the field is empty!").show().fadeOut(4000);
      } else if (isNaN(parseFloat($.trim($("#latitude").val()))) || isNaN(parseFloat($.trim($("#longitude").val())))) {
        return $("span").text("Please be mature and input proper latitude or longitude!").show().fadeOut(4000);
      }
      const data = $form.serialize();
      $.post(`/api/maps/`, data)
        .then(() => {
          console.log(data);
          $.get(`/api/users/${user_id}`, (obj) => {
            renderNav();
          });
        });
    });

    // cancel button for createMap
    $form.on('click', '#cancelButton', () => {
      console.log('cancel button');
      renderNav();
    });



    //WIP
    // $('button.cancel').on('click', function () {
    //   $sidebar.empty()
    // })

    //form submit for creating pins
    const $pinform = $(`<form>
    <input type="hidden" name="creator_id" value="${user_id}" />
    <label for="title">Pin Name:</label><br><br>
    <input type="text" name="title" id="name" placeholder="New Pin" /><br><br>
    <label for="description">Description:</label><br><br>
    <textarea type="text" name="description" placeholder="description" /><br><br>
    <label for="img_url">Image URL:</label><br><br>
    <input type="text" name="image_url" id="image" placeholder="image url" /><br><br>
    <p class="submit_popup">Please click on the map where you would like to create your pin.</p>
    <label for="latitude" class="pinlat" hidden></label><br>
    <input type="text" class="pinlat" name="latitude" hidden />
    <label for="longitude" class="pinlng" hidden></label><br>
    <input type="text" class="pinlng" name="longitude" hidden/>
    <input type="text" id="form-map-id" name="map_id" hidden />
    <button class="submit_popup" type="submit" hidden>submit</button>
    <button class="cancel" type="cancel">cancel</button>
    </form>`);

    //clicking createPin button
    $('.sidebar').on('click', '.createPin', function() {
      const map_id = $(this).attr('id');
      console.log('createpin on click mapid', map_id);
      //$('#form-map-id').val(map_id);
      const $pin_bar = $('div.pin_container');
      $pin_bar.empty();
      $pin_bar.append($pinform);
      $('div.pin_details').addClass('left_side') //animate this
      $('.toggle_button').removeClass('toggle_open').addClass('toggle_close')

      window.marker = {};
      window.onClickMap = (e) => {
        lat = e.latlng.lat;
        lon = e.latlng.lng;
        if (marker != undefined) {
          map.removeLayer(marker);
        };
        marker=L.marker(e.latlng).addTo(window.map);
        marker.bindPopup(`Right here? <button>Yes</button><button>No</button>`).openPopup();
        $('p.submit_popup').hide();
        $('button.submit_popup').show();
        $('label.pinlat').show().text(`latitude: ${e.latlng.lat}`)
        $('label.pinlng').show().text(`longitude: ${e.latlng.lng}`)
        $('input.pinlat').val(e.latlng.lat)
        $('input.pinlng').val(e.latlng.lng)
        $('#form-map-id').val(map_id);
      };

      map.on('click', onClickMap);
    })

    $pinform.submit((event) => {
      event.preventDefault();
      const data = $pinform.serialize();
      console.log('form submitted, data is', data);
      // get map_id
      console.log('posting to ajax');
      $.post(`/api/pins/`, data)
      .then(obj => {
        const pinID = obj.pin[0].id;
        console.log('line 323', obj, 'dafs', obj.pin[0].id );
        $.post(`/api/mapPins/${obj.map_id}`, {pinID})
        .then(obj => {
          console.log('posted to both tables', obj);
        });
      })
      // .then((obj) => {
      //   window.reload();
      //   console.log('did we just post? obj:', obj)
      //   $.get(`/api/users/${user_id}`, (obj) => {
      //     console.log('obj:', obj)
      //   });
      //   });
    });

    $('.pin_container').on('click', '.cancel', function(e){
      e.preventDefault();
      console.log('cancel clicked');
      const $pin_bar = $('div.pin_container');
      const div = L.DomUtil.get('div_id');

      map.off('click', onClickMap);
      map.removeLayer(window.marker);

      // TODO: remove layer for temp pin
      $pin_bar.empty();
      $('.pin_details').toggleClass('left_side', 300, 'easeOutQuint');
      $('.toggle_button').toggleClass('toggle_close');
    });

    //favourite map buttons
    $.get(`/api/faveMaps/${user_id}`, (obj) => {
      const mapDiv = $(".mapButtons");
      const $faveMapNav = $(`</br>
        <h3> Favourite Maps </h3>
      `)
      $faveMapNav.appendTo(mapDiv)
      console.log('fav maps:', obj);
      for (let i = 0; i < obj.length; i++) {
        const { id, name, username } = obj[i];
        const $faveMapButton = $(`<div>${name}<br>created by: ${username}</div><br>`);
        $($faveMapButton).attr('id', `${id}`);
        $faveMapButton.addClass('map-button');
        $faveMapButton.appendTo(mapDiv);
      }
    })
  };

  /* get current logged in user object from the users table and set it to global variable
  which includes id, username, password, latitue, longitude */
  const getUser = (callback) => {
    $.get('/api/users/me', (obj) => {
      console.log('logged in user is:', window.user);
      window.user = obj;
      callback();
    });
  };

  getUser(() => {
    renderNav();
  });

  const renderNav = () => {
    if (userIsLoggedIn()) {
      console.log('user is logged in');
      updateUserLocation();
      renderNavLoggedIn();
    } else {
      console.log('usr is not logged in');
      const $sidebar = $('.sidebar');
      $sidebar.empty();
      const $nearbyMaps = $(`<header>user not logged in</header>
      <div>
        <h3>Nearby Maps</h3>
        <div class='mapButtons'></div>
      </div>`);
      $nearbyMaps.appendTo($sidebar);
      updateUserLocation();
      getMapNearUserLocation();
    }
  };
});
