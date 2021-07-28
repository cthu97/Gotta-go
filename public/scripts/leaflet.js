//documentready
$(() => {
  const map = L.map('map', {
    center: [48.42959706075791, -123.34509764072138],
    zoom: 13
  })

  //set to user location
  map.locate({ setView: true, maxZoom: 15 })

  L.tileLayer('https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=IWRRuvOlBlyhZTVNm8VO', {
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    }).addTo(map);

  //const map1 = L.layerGroup([])

  //create marker for map
  console.log('leaflet.js');
  function makePin(pin) {
    const marker = L.marker([pin.latitude, pin.longitude])
    marker.addTo(map)
    const image = `<img src="${pin.image_url}">`
    const title = pin.title;
    const description = pin.description;
    marker.bindPopup(`${image} <br> <h3> ${title} </h3> <br> ${description}`);
  }


  //only load pins within radius
  function radiusCheck(pin, rad) {
  const mapLng = map.getCenter().lng
  const mapLat = map.getCenter().lat
  if (mapLat - rad <= pin.latitude && pin.latitude <= mapLat + rad) {
    if (mapLng - rad <= pin.longitude && pin.longitude <= mapLng + rad){
        return true;
      }
    }
  }

  $.get('/api/pins', (obj) => {
    for (const pin of obj.pins) {
     makePin(pin)
    }
  });


  //used to control loading of pins/handle lag
  map.on('load', function () {
    $.get('/api/pins', (obj) => {
      for (const pin of obj.pins) {
        //if the pin is in a ~100km radius of the center of the map then it will load to the map
        if (radiusCheck(pin, 0.5)) {
          makePin(pin);
        } else {
          map.remove(pin);
          console.log('no pin in range')
        }
      }
    })
  })


  //only works for buttons with class of "mapButtons"
  const elements = document.getElementsByClassName("mapButtons")

  //pans to map [x]'s coordinates
  $(elements).on('click', function () {
    const zoom = 14;
    const buttonID = (this.id);
    console.log("ID = " + buttonID);

    $.getJSON(`http://localhost:8080/api/maps/${buttonID}`, function (result) {
      const latitude = result.maps[0].latitude
      const longitude = result.maps[0].longitude
      map.panTo([latitude, longitude], zoom);
    })
  })












  $.get('/api/users', (obj) => {
    // console.log('side-bar.js', obj);
    for (const user of obj.users) {
      // console.log(user.username);
    }

    // <header>user:</header>
    // <div>
    //   <h3>User maps</h3>
    //   <div class='mapButtons'></div>
    // </div>
    const $userMaps = $(`<header>user not logged in</header>
    <div>
      <h3>User maps</h3>
      <div class='mapButtons'></div>
    </div>
    `);

    $userMaps.appendTo($('.sidebar'));



    let username, user_lat, user_long;
    // console.log('object is: ', obj);
    if (obj.user_id) {
      // if user_id exist:
      const user_id = obj.user_id;
      $.get(`/api/users/${user_id}`, (obj) => {
        console.log(`user ${user_id}`, obj);
        console.log(`username`, obj.userData[0].username);
        username = obj.userData[0].username;
        user_lat = obj.userData[0].user_lat;
        user_long = obj.userData[0].user_long;

        $.get(`/api/users/`, (obj) => {});

        // <div class="favourites">
        //   <h3>Favourited Maps</h3>
        //   <ul>Map2</ul>
        // </div>
        // <footer>
        //   <button>create map</button>
        //   <button>create pin</button>
        // </footer>


        $(".sidebar header").text(`user: ${username}`);
        const $createButton = $('<footer><button>create map</button></footer>');
        $createButton.appendTo($('.sidebar'));
        console.log('create button', $createButton);



        // const map = L.map('map', {
        //   center: [user_lat, user_long], //set this to user location
        //   zoom: 13
        // });

        // L.tileLayer('https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=IWRRuvOlBlyhZTVNm8VO', {
        //   attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        // }).addTo(map);


        // get user location
        map.locate({ setView: true, maxZoom: 15 });

        // patch user location in the database
        $.ajax({
          url : `http://localhost:8080/api/users/${user_id}`,
          type : 'PATCH',
          data : {latitude: user_lat, longitude: user_long},
          success : function() {
              console.log("user location Successfully Patched!");
          },
          error : function(jqXHR, textStatus, errorThrown) {
              // log the error to the console
              console.log("The following error occured: " + textStatus, errorThrown);
          },
          complete : function() {
              console.log("Patching completed");
          }
        });

        //only works for buttons with class of "mapButtons"
        const mapDiv = document.getElementsByClassName("mapButtons")

        for (let i = 0; i < obj.userData.length; i++) {
          const map_name = obj.userData[i].map_name;
          const map_id = obj.userData[i].map_id;
          const $mapButton = $(`<div><button>${map_name}</button></div>`);
          $($mapButton).attr('id', `${map_id}`);
          $mapButton.addClass('map-button');
          // console.log('map button:', mapButton);
          // console.log('map button id', mapButton.attr('id'));
          $mapButton.appendTo(mapDiv);
        }

        //pans to map [x]'s coordinates
        $('.map-button').on('click', function() {
          const zoom = 14;
          const buttonID = $(this).attr('id');
          console.log("button ID = " + buttonID);

          $.getJSON(`http://localhost:8080/api/maps/${buttonID}`, function (result) {
            console.log('result', result);
            const map_lat = result.maps[0].latitude;
            const map_long = result.maps[0].longitude;
            map.panTo([map_lat, map_long], zoom);
          })
        })

        const $form = $(`<form>
            <input type="hidden" name="creator_id" value="${user_id}" />

            <label for="name">Map name:</label><br><br>
            <input type="text" name="name" id="name" value="Map Name3" /><br><br>

            <label for="latitude">Latitude:</label><br><br>
            <input type="text" name="latitude" id="latitude" value="48.2827" /><br><br>

            <label for="longitude">Longitude:</label><br><br>
            <input type="text" name="longitude" id="longitude" value="-124.1207" /><br><br>
            <button type="submit">submit</button>
          </form> `);

        $('.sidebar footer').on('click', function() {
          console.log('create button clicked', $createButton);
          const $sidebar = $('.sidebar');
          $sidebar.empty();
          $form.appendTo($sidebar);
        });

        $form.submit( (event) => {
          event.preventDefault();
          console.log('form submitted form:', $form)
          const data = $form.serialize();
          console.log('form submitted data:', data)

          $.post(`/api/maps/`, data)
            .then(() => {
              console.log(data);
              $.get(`/api/users/${user_id}`, (obj) => {
                location.reload();
              });
            });
        });
      });

      // user does not exist
    } else {
      const $header = $('.sidebar h3');
      $header.text('Nearby Maps');

      // set default lat long
      user_lat = 49.260833;
      user_long = 123.113889;

      // const map = L.map('map', {
      //   center: [user_lat, user_long], //set this to user location
      //   zoom: 13
      // });

      // L.tileLayer('https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=IWRRuvOlBlyhZTVNm8VO', {
      //   attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
      // }).addTo(map);


      //set map to user location
      map.locate({ setView: true, maxZoom: 15 })
        .on('locationfound', function(e) {
          user_lat = e.latitude;
          user_long = e.longitude;
          console.log('updated user location: lat:', user_lat, 'long:', user_long )
          const radius = e.accuracy / 2;
          const myIcon = L.icon({
            iconUrl: 'https://assets.stickpng.com/images/580b57fcd9996e24bc43c39c.png',
            iconSize: [38, 38],
            iconAnchor: [20, 20],
            popupAnchor: [0, -15]
          });
          const marker = L.marker(e.latlng, {icon: myIcon}).addTo(map);
          const popup = L.popup().setContent(`<h3>You are within ${radius} meters from this point</h3>`);
          marker.bindPopup(popup).openPopup();
          L.circle(e.latlng, radius).addTo(map);

          $.get(`/api/maps/${user_lat}/${user_long}`, (obj) => {

            console.log('map obj according to location',obj.maps);
            const mapDiv = $('.mapButtons')
            mapDiv.empty();
            for (let i = 0; i < obj.maps.length; i++) {
              const map_name = obj.maps[i].name;
              const map_id = obj.maps[i].id;
              const mapButton = $(`<div><button>${map_name}</button></div>`);
              $(mapButton).attr('id', `${map_id}`);
              mapButton.addClass('map-button');
              // console.log('map button:', mapButton);
              // console.log('map button id', mapButton.attr('id'));
              mapButton.appendTo(mapDiv);
            }

            //pans to map [x]'s coordinates
            $('.map-button').on('click', function () {
              const zoom = 14;
              const buttonID = $(this).attr('id');
              console.log("button ID = " + buttonID);

              $.getJSON(`http://localhost:8080/api/maps/${buttonID}`, function (result) {
                console.log('result', result);
                const map_lat = result.maps[0].latitude;
                const map_long = result.maps[0].longitude;
                map.panTo([map_lat, map_long], zoom);
              })
            })
          });
        });


      // $('.continue-button').on('click', function(e) {
      //   e.preventDefault();
      //   console.log('not logging in clicked');
      //   window.location = `http://localhost:8080/api/maps/${user_lat}/${user_long}`;
      // });



    }
    });
});
