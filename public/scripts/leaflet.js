$(() => {
  //set to user location
  map.locate({ setView: true, maxZoom: 15 })
  // console.log(getUser())
  //use getUser(), use window.user




  //const map1 = L.layerGroup([])

  //set to true if create map is selected
  const createMap = false;

  const makePin = (pin) => {


    const myIcon = L.icon({
      iconUrl: src = '/images/toilet.png',
      iconSize: [38, 38],
      iconAnchor: [20, 20],
      popupAnchor: [0, -15]
    });



    const marker = L.marker([pin.latitude, pin.longitude], { icon: myIcon });
    marker.pin_id = pin.id;
    const title = pin.title;
    const description = pin.description;
    //create popup
    marker.bindPopup(`<h3> ${title} </h3> <br> ${userDistance([pin.latitude, pin.longitude])}m away`);

    //behaviour for when marker is clicked
    marker.on('click', function() {
      const $title = $('<header>', {'class': 'pin_title'}).text(title);
      const $img = $('<img>', {'class': 'image'}).attr('src', pin.image_url);
      const $description = $('<p>', { 'class': 'write_up'}).text(description);
      const $descriptionDiv = $('<div>', { 'class': 'description'});
      const $nav = $('<nav>', {'class': 'pin_bar'});
      const $footer = $('<footer>');
      const $rateButton = $('<button>', {'class': 'edit_pin'}).text('Rate Bathroom');
      const $editButton = $('<button>', {'class': 'edit_pin'}).text('edit pin').attr('hidden', true);
      const $addButton = $('<button>', {'class': 'add_pin'}).attr('hidden', true).text('report pin');
      if (createMap){
        $addButton.attr('hidden', false);
      };
      $descriptionDiv.append($img, $description);
      $footer.append($rateButton, $editButton, $addButton);
      $nav.append($title, $descriptionDiv, $footer);
      $('div.pin_container').empty();
      $('div.pin_container').append($nav);
      $('div.pin_details').addClass('left_side') //animate this
      $('.toggle_button').removeClass('toggle_open').addClass('toggle_close')
      map.flyTo([pin.latitude, pin.longitude], 15);
    })
    return marker;
  }


  //only load pins within radius
  function radiusCheck(pin, rad) {
    const mapLng = map.getCenter().lng
    const mapLat = map.getCenter().lat
    if (mapLat - rad <= pin.latitude && pin.latitude <= mapLat + rad) {
      if (mapLng - rad <= pin.longitude && pin.longitude <= mapLng + rad) {
        return true;
      }
    }
  }

  // get all pins
  window.getAllPins = (cb) => {
    map.eachLayer(function (layer) {
      if (layer.map_id) {
        map.removeLayer(layer);
      }
    });
    if (window.allPins) {
      map.removeLayer(window.allPins);
    }
    $.get('/api/pins/', (obj) => {
      window.allPins = L.layerGroup();
      for (const pin of obj.pins) {
        const temp = makePin(pin);
        temp.addTo(allPins);
      }
      window.allPins.addTo(window.map);
    });
  };
  getAllPins();

  // map: {{mapleLayer1: [marker1, marker 2]}, {mapleLayer2: [marker1, marker 2]}, {mapleLayer3: [marker1, marker 2]}}
  // add layers to Map
  window.addLayer = () => {
    $.get(`/api/maps/`, (maps) => {
      console.log("getting maps", maps);
      // global object mapLayers
      window.mapLayers = L.layerGroup();
      // for each map
      for (let i = 0; i < maps.maps.length; i++) {
        const map = maps.maps[i];
        const map_id = map.id;
        // new mapLayer for each map
        const mapLayer = L.layerGroup();
        // getting pins from specific map_id
        $.get(`/api/mapPins/${map_id}`, (pins) => {
          // add a map_id object to the map and set it to this map's id
          mapLayer['map_id'] = map_id;
          for (const i in pins) {
            const pin = pins[i];
            const tempPin = makePin(pin);
            tempPin.addTo(mapLayer);
          }
          mapLayer.addTo(window.mapLayers);
        });
      }
      window.mapLayers.addTo(window.map);
    });
  };
  addLayer();


  // //used to control loading of pins/handle lag
  // map.on('load', function () {
  //   // $.get(`/api/mapPins/${map_id}`, (obj) => {

  //   // });
  //   console.log('on map load');
  //   $.get('/api/pins', (obj) => {
  //     for (const pin of obj.pins) {
  //       //if the pin is in a ~100km radius of the center of the map then it will load to the map
  //       if (radiusCheck(pin, 0.5)) {
  //         makePin(pin);
  //       } else {
  //         map.remove(pin);
  //       }
  //     }
  //   })
  // })


  //only works for buttons with class of "mapButtons"
  const elements = document.getElementsByClassName("mapButtons")

  //pans to map [x]'s coordinates
  $(elements).on('click', function () {
    const zoom = 14;
    const buttonID = (this.id);

    $.getJSON(`http://localhost:8080/api/maps/${buttonID}`, function (result) {
      const latitude = result.maps[0].latitude
      const longitude = result.maps[0].longitude
      map.panTo([latitude, longitude], zoom);
    })
  })

  //################################################################## maps stuff ##################################################################
});
