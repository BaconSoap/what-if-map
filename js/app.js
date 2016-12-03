$(document).foundation();

var demRepubScale = chroma.scale(['red', 'white', 'blue']).domain([-1, 0, 1]);

(function(){
  var map;

  function init() {
    // create a new map with no base layer
    map = new L.Map('election-map', {
      center: new L.LatLng(42.3964631, -91.1205171),
      zoom: 4
    });

    var countiesPane = map.createPane('counties');
    var statesPane = map.createPane('states');

    // use Stamen's 'terrain' base layer
    var layer = new L.StamenTileLayer('terrain');
    map.addLayer(layer);

    jQuery.getJSON('data/counties.json', function(data) {
      var countiesLayer = L.geoJSON(data, {
        pane: 'counties',
        style: function(feature) {
          var p = feature.properties;
          return {
            fillOpacity: .9,
            fillColor: demRepubScale((p.votes_dem - p.votes_gop) / p.total_votes * 2),
            color: 'grey',
            weight: 1
          };
        }
      });
      map.addLayer(countiesLayer);
    });

    jQuery.getJSON('data/states.json', function(data) {
      var statesLayer = L.geoJSON(data, {
        style: function(feature) {
          return {
            color: 'black',
            weight: 1,
            fillOpacity: 0
          };
        },
        pane: 'states'
      });

      map.addLayer(statesLayer);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
