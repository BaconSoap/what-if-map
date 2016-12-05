var app;
(function (app) {
    app.CountyInfo = L.Control.extend({
        onAdd: function (map) {
            this._div = L.DomUtil.create('div', 'custom-control county-info');
            this.update();
            return this._div;
        },
        update: function (props, year) {
            this._div.innerHTML = '<h6>Election Results</h6>' +
                (props && props['total_votes_' + year]
                    ? props.county_name + ', ' + props.state_abbr +
                        '<br/>Dem: ' + props['votes_dem_' + year].toLocaleString() +
                        '<br/>GOP: ' + props['votes_gop_' + year].toLocaleString()
                    : '');
        }
    });
    app.dropdownControl = L.Control.extend({
        options: { position: 'topleft', selectOptions: [], label: '' },
        onAdd: function (map) {
            this._container = L.DomUtil.create('div', 'custom-control');
            var label = L.DomUtil.create('span', '', this._container);
            label.innerHTML = this.options.label;
            this._select = L.DomUtil.create('select', '', this._container);
            var inner = this.options.selectOptions.map(function (s) { return '<option>' + s.text + '</option>'; }).join('');
            this._select.innerHTML = inner;
            this._select.onmousedown = L.DomEvent.stopPropagation;
            return this._container;
        },
        onChange: function (onChange) {
            this._onChange = onChange;
            this._select.onchange = onChange;
        }
    });
})(app || (app = {}));
var app;
(function (app) {
    var coastalStates = ['ak', 'al', 'ca', 'ct', 'de', 'fl', 'ga', 'hi', 'la', 'ma', 'md', 'me', 'ms', 'nc', 'nh', 'nj', 'ny', 'or', 'ri', 'sc', 'tx', 'va', 'wa'];
    var newEnglandStates = ['me', 'vt', 'nh', 'ma', 'ri', 'ct'];
    app.Scenarios = [];
    app.Scenarios[0 /* Reality */] = {
        text: 'As it happened',
        filter: function (feature) {
            return true;
        }
    };
    app.Scenarios[1 /* Coastal */] = {
        text: 'Only coastal states',
        filter: function (feature) {
            var abbr = feature.properties.state_abbr || '';
            return coastalStates.indexOf(abbr.toLowerCase()) > -1;
        }
    };
    app.Scenarios[2 /* NonCoastal */] = {
        text: 'Only non-coastal states',
        filter: function (feature) {
            var abbr = feature.properties.state_abbr || '';
            return coastalStates.indexOf(abbr.toLowerCase()) === -1;
        }
    };
    app.Scenarios[3 /* NewEngland */] = {
        text: 'Only New England *',
        filter: function (feature) {
            var abbr = feature.properties.state_abbr || '';
            return newEnglandStates.indexOf(abbr.toLowerCase()) > -1;
        }
    };
    var SceneraioPicker = (function () {
        function SceneraioPicker(targetId) {
            var _this = this;
            this.el = document.getElementById(targetId);
            app.Scenarios.forEach(function (s, i) { return _this.el.add(new Option(s.text, i.toString(), i === 0 /* Reality */)); });
        }
        SceneraioPicker.prototype.onChange = function (fn) {
            this.el.onchange = function (e) {
                var selected = parseInt(e.target.value);
                var selectedScenario = app.Scenarios[selected];
                fn(selectedScenario);
            };
        };
        return SceneraioPicker;
    }());
    app.SceneraioPicker = SceneraioPicker;
})(app || (app = {}));
///<reference path="../node_modules/@types/leaflet/index.d.ts" />
/// <reference path="./controls.ts" />
/// <reference path="./scenarioPicker.ts" />
var app;
(function (app) {
    var voteResults = {
        electoralVotes: 0,
        demPopularVotes: 0,
        gopPopularVotes: 0,
        demElectoralVotes: 0,
        gopElectoralVotes: 0
    };
    $(document).foundation();
    var demRepubScale = chroma.scale(['red', 'white', 'blue']).domain([-1, 0, 1]);
    var activeYear = '2016';
    var activeScenario;
    var map;
    var countyInfo;
    function init() {
        // create a new map with no base layer
        map = L.map('election-map', {
            center: L.latLng(42.3964631, -91.1205171),
            zoom: 4
        });
        // use Stamen's 'terrain' base layer
        var layer = new L.StamenTileLayer('toner');
        map.addLayer(layer);
        activeScenario = app.Scenarios[0 /* Reality */];
        addCounties('2016');
        addStates();
        countyInfo = new app.CountyInfo();
        countyInfo.addTo(map);
        var selector = new app.dropdownControl({ selectOptions: [{ text: '2016' }, { text: '2012' }], label: 'Year:' });
        selector.addTo(map);
        selector.onChange(function (e) {
            var year = e.target.value;
            addCounties(year);
        });
        var picker = new app.SceneraioPicker('scenario-select');
        picker.onChange(function (scenario) { return setScenario(scenario); });
    }
    function setScenario(scenario) {
        activeScenario = scenario;
        var layer = createLayer(scenario.filter);
        setLayer(layer);
        showWinner(voteResults);
    }
    function showWinner(results) {
        var demRunner = activeYear === '2016' ? 'Hillary Clinton' : 'Barack Obama';
        var gopRunner = activeYear === '2016' ? 'Donald Trump' : 'Mitt Romney';
        var eDemWinner = results.demElectoralVotes > results.gopElectoralVotes;
        var pDemWinner = results.demPopularVotes > results.gopPopularVotes;
        $('#electoralWinner').text(eDemWinner ? demRunner : gopRunner);
        $('#popWinner').text(pDemWinner ? demRunner : gopRunner);
        $('#gopElectoralVotes').text(results.gopElectoralVotes);
        $('#demElectoralVotes').text(results.demElectoralVotes);
    }
    function addCounties(year) {
        var countiesPane = map.getPane('counties') || map.createPane('counties');
        activeYear = year;
        if (!app.allCountyData) {
            jQuery.getJSON('data/counties.json', function (data) {
                app.allCountyData = data;
                var layer = createLayer(activeScenario.filter);
                setLayer(layer);
                showWinner(voteResults);
            });
        }
        else {
            var layer = createLayer(activeScenario.filter);
            setLayer(layer);
            showWinner(voteResults);
        }
    }
    function createLayer(filter) {
        var data = app.allCountyData;
        var states = {};
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
                var p = feature.properties;
                var state = (p.state_abbr || '').toLowerCase();
                var s = states[state] || { electoralVotes: p.electoral_votes, demPopularVotes: 0, gopPopularVotes: 0 };
                states[state] = s;
                s.gopPopularVotes += p['votes_gop_' + activeYear];
                s.demPopularVotes += p['votes_dem_' + activeYear];
                layer.on({
                    'mouseover': onHover,
                    'mouseout': onUnhover,
                    'click': onClick
                });
            },
            filter: function (feature) {
                return filter(feature);
            }
        });
        var total = { electoralVotes: 0, demPopularVotes: 0, gopPopularVotes: 0, demElectoralVotes: 0, gopElectoralVotes: 0 };
        for (var stateCode in states) {
            if (stateCode.length === 2) {
                var stateResult = states[stateCode];
                var electoralVotes = stateResult.electoralVotes;
                var isDemWinner = stateResult.demPopularVotes > stateResult.gopPopularVotes;
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
    var activeCountiesLayer;
    function setLayer(layer) {
        if (activeCountiesLayer) {
            map.removeLayer(activeCountiesLayer);
        }
        activeCountiesLayer = layer;
        map.addLayer(activeCountiesLayer);
    }
    function getColor(feature) {
        var year = activeYear;
        var p = feature.properties;
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
            color: getColor(layer.feature)
        });
        countyInfo.update();
    }
    function onClick(e) {
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
})(app || (app = {}));
