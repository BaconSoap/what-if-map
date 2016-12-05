///<reference path="../node_modules/@types/leaflet/index.d.ts" />
/// <reference path="./controls.ts" />
/// <reference path="./scenarioPicker.ts" />

declare namespace L {
  namespace Control {
    function extend<T>(options?: T): L.Control & T & { new (opts?: any): L.Control & T };
  }
}

namespace app {
  type Year = '2012' | '2016';
  interface IDataLayerProperties {
    votes_dem_2016: number;
    votes_dem_2012: number;
    votes_gop_2016: number;
    votes_gop_2012: number;
    total_votes_2016: number;
    total_votes_2012: number;
    electoral_votes: number;
    state_abbr: string;
  }

  let voteResults = {
    electoralVotes: 0,
    demPopularVotes: 0,
    gopPopularVotes: 0,
    demElectoralVotes: 0,
    gopElectoralVotes: 0
  }

  $(document).foundation();

  var demRepubScale = chroma.scale(['red', 'white', 'blue']).domain([-1, 0, 1]);
  var activeYear: Year = '2016';

  export var allCountyData: GeoJSON.GeoJsonObject;
  var map: L.Map;
  let countyInfo: ICountyInfo;
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

    countyInfo = new CountyInfo() as any;
    countyInfo.addTo(map);
    var selector = new dropdownControl({ selectOptions: [{ text: '2016' }, { text: '2012' }], label: 'Year:' })
    selector.addTo(map);
    selector.onChange(function (e: OnChangeEvent) {
      var year = e.target.value as Year;
      addCounties(year);
    });
    var picker = new SceneraioPicker('scenario-select')
    picker.onChange((scenario: IScenario) => setScenario(scenario));
  }

  function setScenario(scenario: IScenario) {
    console.log(scenario);
    let layer = createLayer(scenario.filter);
    setLayer(layer);
    showWinner(voteResults);
  }

  function showWinner(results: typeof voteResults) {
    let demRunner = activeYear === '2016' ? 'Hillary Clinton' : 'Barack Obama';
    let gopRunner = activeYear === '2016' ? 'Donald Trump' : 'Mitt Romney';
    let eDemWinner = results.demElectoralVotes > results.gopElectoralVotes;
    let pDemWinner = results.demPopularVotes > results.gopPopularVotes;
    $('#electoralWinner').text(eDemWinner ? demRunner : gopRunner);
    $('#popWinner').text(pDemWinner ? demRunner : gopRunner);
    $('#gopElectoralVotes').text(results.gopElectoralVotes);
    $('#demElectoralVotes').text(results.demElectoralVotes);
  }

  function addCounties(year: Year) {
    var countiesPane = map.getPane('counties') || map.createPane('counties');

    activeYear = year;

    if (!allCountyData) {
      jQuery.getJSON('data/counties.json', function (data) {
        allCountyData = data;
        let layer = createLayer(() => true);
        setLayer(layer);
        showWinner(voteResults);
      });
    } else {
      let layer = createLayer(() => true);
      setLayer(layer);
      showWinner(voteResults);
    }
  }

  function createLayer(filter: Function) {
    let data = allCountyData;
    let states: { [state: string]: typeof voteResults } = {};
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
        let p = feature.properties as IDataLayerProperties;
        let state = (p.state_abbr || '').toLowerCase();
        let s = states[state] || { electoralVotes: p.electoral_votes, demPopularVotes: 0, gopPopularVotes: 0 };
        states[state] = s
        s.gopPopularVotes += (p as any)['votes_gop_' + activeYear];
        s.demPopularVotes += (p as any)['votes_dem_' + activeYear];
        layer.on({
          'mouseover': onHover,
          'mouseout': onUnhover,
          'click': onClick
        })
      },
      filter: function (feature) {
        return filter(feature);
      }
    });

    let total: typeof voteResults = { electoralVotes: 0, demPopularVotes: 0, gopPopularVotes: 0, demElectoralVotes: 0, gopElectoralVotes: 0 };
    for (let stateCode in states) {
      if (stateCode.length === 2) {
        let stateResult = states[stateCode];
        let electoralVotes = stateResult.electoralVotes;
        let isDemWinner = stateResult.demPopularVotes > stateResult.gopPopularVotes;
        total.electoralVotes += electoralVotes;
        total.demElectoralVotes += isDemWinner ? electoralVotes : 0;
        total.gopElectoralVotes += !isDemWinner ? electoralVotes : 0;
        total.demPopularVotes += stateResult.demPopularVotes;
        total.gopPopularVotes += stateResult.gopPopularVotes;
      }
    }
    voteResults = total;

    return countiesLayer;
  }

  let activeCountiesLayer: L.Layer;
  function setLayer(layer: L.Layer) {
    if (activeCountiesLayer) {
      map.removeLayer(activeCountiesLayer);
    }
    activeCountiesLayer = layer;
    map.addLayer(activeCountiesLayer);
  }

  function getColor(feature: GeoJSON.Feature<GeoJSON.GeometryObject>) {
    let year = activeYear;
    var p = feature.properties as any;
    return demRepubScale((p['votes_dem_' + year] - p['votes_gop_' + year]) / p['total_votes_' + year] * 2);
  }

  function onHover(e: L.LayerEvent) {
    var layer = e.target as L.Path;
    layer.setStyle({
      weight: 5,
      color: 'gold'
    });
    countyInfo.update((layer as any).feature.properties, activeYear);
  }

  function onUnhover(e: L.LayerEvent) {
    var layer = e.target;
    layer.setStyle({
      weight: 1,
      color: getColor(layer.feature)
    });

    countyInfo.update();
  }

  function onClick(e: L.LayerEvent & { target: L.Layer }) {
    map.fitBounds(e.target.getBounds(), {});
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
