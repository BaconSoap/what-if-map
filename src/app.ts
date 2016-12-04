///<reference path="../node_modules/@types/leaflet/index.d.ts" />
/// <reference path="./controls.ts" />

declare namespace L {
  namespace Control {
    function extend<T>(options?: T): L.Control & T & { new (opts: any) };
  }
}

namespace app {
  type Year = '2012' | '2016';

  interface IDataLayerProperties {

  }

  $(document).foundation();

  var demRepubScale = chroma.scale(['red', 'white', 'blue']).domain([-1, 0, 1]);
  var activeYear: Year = '2016';

  var allCountyData;
  var countiesLayers = {};
  var map;

  function init() {
    // create a new map with no base layer
    map = L.map('election-map', {
      center: L.latLng(42.3964631, -91.1205171),
      zoom: 4
    });

    // use Stamen's 'terrain' base layer
    var layer = new (L as any).StamenTileLayer('toner') as L.TileLayer;
    map.addLayer(layer);

    addCounties('2016');
    addStates();

    countyInfo.addTo(map);
    var selector = new dropdownControl({ selectOptions: [{ text: '2016' }, { text: '2012' }], label: 'Year:' })
    selector.addTo(map);
    selector.onChange(function (e) {
      var year = e.target.value;
      addCounties(year);
    });
  }

  function addCounties(year) {
    var countiesPane = map.getPane('counties') || map.createPane('counties');
    activeYear = year;
    if (countiesLayers[year]) {
      map.removeLayer(countiesLayers['active']);
      map.addLayer(countiesLayers[year]);
      countiesLayers['active'] = countiesLayers[year];
      return;
    }

    if (!allCountyData) {
      jQuery.getJSON('data/counties.json', function (data) {
        allCountyData = data;
        setLayer();
      });
    } else {
      setLayer();
    }

    function setLayer() {
      let data = allCountyData;
      var countiesLayer = L.geoJSON(data, {
        pane: 'counties',
        style: function (feature) {
          var color = getColor(feature, year);
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
      countiesLayers[year] = countiesLayer;
      countiesLayers['active'] = countiesLayer;
    }

    function getColor(feature, year: Year) {
      var p = feature.properties as IDataLayerProperties;
      return demRepubScale((p['votes_dem_' + year] - p['votes_gop_' + year]) / p['total_votes_' + year] * 2);
    }

    function onHover(e) {
      var layer = e.target;
      layer.setStyle({
        weight: 5,
        color: 'gold'
      });
      countyInfo.update(layer.feature.properties, activeYear);
    }

    function onUnhover(e) {
      var layer = e.target;
      layer.setStyle({
        weight: 1,
        color: getColor(layer.feature, activeYear)
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


}
