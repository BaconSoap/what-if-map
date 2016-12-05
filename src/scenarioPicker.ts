namespace app {
  export const enum ScenarioTypes {
    Reality,
    Coastal,
    NonCoastal,
    NewEngland
  }

  let coastalStates = ['ak', 'al', 'ca', 'ct', 'de', 'fl', 'ga', 'hi', 'la', 'ma', 'md', 'me', 'ms', 'nc', 'nh', 'nj', 'ny', 'or', 'ri', 'sc', 'tx', 'va', 'wa'];
  let newEnglandStates = ['me', 'vt', 'nh', 'ma', 'ri', 'ct'];
  export interface IScenario {
    text: string;
    filter: (feature: GeoJSON.Feature<any>) => boolean;
  }
  export let Scenarios: Array<IScenario> = [];
  Scenarios[ScenarioTypes.Reality] = {
    text: 'As it happened',
    filter: (feature: GeoJSON.Feature<any>) => {
      return true;
    }
  };
  Scenarios[ScenarioTypes.Coastal] = {
    text: 'Only coastal states',
    filter: (feature: GeoJSON.Feature<any>) => {
      let abbr = feature.properties.state_abbr || '';
      return coastalStates.indexOf(abbr.toLowerCase()) > -1;
    }
  };
  Scenarios[ScenarioTypes.NonCoastal] = {
    text: 'Only non-coastal states',
    filter: (feature: GeoJSON.Feature<any>) => {
      let abbr = feature.properties.state_abbr || '';
      return coastalStates.indexOf(abbr.toLowerCase()) === -1;
    }
  };
  Scenarios[ScenarioTypes.NewEngland] = {
    text: 'Only New England *',
    filter: (feature: GeoJSON.Feature<any>) => {
      let abbr = feature.properties.state_abbr || '';
      return newEnglandStates.indexOf(abbr.toLowerCase()) > -1;
    }
  };

  export class SceneraioPicker {
    el: HTMLSelectElement;
    constructor(targetId: string) {
      this.el = document.getElementById(targetId) as HTMLSelectElement;
      Scenarios.forEach((s, i) => this.el.add(new Option(s.text, i.toString(), i === ScenarioTypes.Reality)));
    }

    onChange(fn: (scenario: IScenario) => void) {
      this.el.onchange = (e: OnChangeEvent) => {
        var selected = parseInt(e.target.value);
        var selectedScenario = Scenarios[selected];
        fn(selectedScenario);
      }
    }
  }
}
