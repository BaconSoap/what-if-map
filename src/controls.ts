type OnChangeEvent = Event & {target: HTMLInputElement};

namespace app {
  export let countyInfo = L.Control.extend({
    onAdd: function (map: L.Map) {
      this._div = L.DomUtil.create('div', 'custom-control county-info');
      this.update();
      return this._div;
    },
    update: function (props?: any, year?: string) {
      this._div.innerHTML = '<h6>Election Results</h6>' +
        (props && props['total_votes_' + year]
          ? props.county_name + ', ' + props.state_abbr +
          '<br/>Dem: ' + props['votes_dem_' + year].toLocaleString() +
          '<br/>GOP: ' + props['votes_gop_' + year].toLocaleString()
          : '');
    }
  });

  export let dropdownControl = L.Control.extend({
    options: { position: 'topleft', selectOptions: [], label: '' },
    onAdd(map: L.Map) {
      this._container = L.DomUtil.create('div', 'custom-control');
      var label = L.DomUtil.create('span', '', this._container);
      label.innerHTML = this.options.label;
      this._select = L.DomUtil.create('select', '', this._container);
      var inner = this.options.selectOptions.map(function (s: any) { return '<option>' + s.text + '</option>'; }).join('');
      this._select.innerHTML = inner;
      this._select.onmousedown = L.DomEvent.stopPropagation;
      return this._container;
    },
    onChange: function (onChange: (e: OnChangeEvent) => any) {
      this._onChange = onChange;
      this._select.onchange = onChange;
    }
  });
}
