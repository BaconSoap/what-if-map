$(document).foundation();

var demRepubScale = chroma.scale(['red', 'white', 'blue']).domain([-1, 0, 1]);

(function () {
  var map;
  var countyInfo = L.control();
  countyInfo.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'county-info');
    this.update();
    return this._div;
  };

  countyInfo.update = function (props) {
    this._div.innerHTML = '<h6>Election Results</h6>' +
      (props
        ? props.county_name + ', ' + props.state_abbr +
        '<br/>Dem: ' + props.votes_dem.toLocaleString() +
        '<br/>GOP: ' + props.votes_gop.toLocaleString()
        : '');
  };

  function init() {
    // create a new map with no base layer
    map = new L.Map('election-map', {
      center: new L.LatLng(42.3964631, -91.1205171),
      zoom: 4
    });

    // use Stamen's 'terrain' base layer
    var layer = new L.StamenTileLayer('terrain');
    map.addLayer(layer);

    addCounties();
    addStates();

    countyInfo.addTo(map);
  }

  function addCounties() {
    var countiesPane = map.createPane('counties');

    jQuery.getJSON('data/counties.json', function (data) {
      var countiesLayer = L.geoJSON(data, {
        pane: 'counties',
        style: function (feature) {
          var color = getColor(feature);
          return {
            fillOpacity: .9,
            fillColor: color,
            color: color,
            weight: 1,
            className: 'county'
          };
        },
        onEachFeature: function (feature, layer) {
          layer.on({
            'mouseover': onHover,
            'mouseout': onUnhover,
            'click': onClick
          })
        }
      });

      map.addLayer(countiesLayer);
    });

    function getColor(feature) {
      var p = feature.properties;
      return demRepubScale((p.votes_dem - p.votes_gop) / p.total_votes * 2);
    }

    function onHover(e) {
      var layer = e.target;
      layer.setStyle({
        weight: 5,
        color: 'gold'
      });
      countyInfo.update(layer.feature.properties);
    }

    function onUnhover(e) {
      var layer = e.target;
      layer.setStyle({
        weight: 1,
        color: getColor(layer.feature)
      });

      countyInfo.update();
    }

    function onClick(e) {
      map.fitBounds(e.target.getBounds());
    }
  }

  function addStates() {
    var statesPane = map.createPane('states');

    jQuery.getJSON('data/states.json', function (data) {
      var statesLayer = L.geoJSON(data, {
        style: function (feature) {
          return {
            color: 'black',
            weight: 1,
            fillOpacity: 0,
            className: 'no-pointer-events'
          };
        },
        pane: 'states'
      });

      map.addLayer(statesLayer);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
