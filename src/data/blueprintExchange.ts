export type BlueprintExchange = { [resource: string]: [string | string[], number][] };

const blueprintExchange: BlueprintExchange = {
  Atramentum: [
    ["Enkaus", 1200],
    [["Enkaus Barrel", "Enkaus Receiver", "Enkaus Stock"], 400],
  ],

  "Beating Heartstrings": [
    ["Riot-848", 120],
    [["Riot-848 Barrel", "Riot-848 Receiver", "Riot-848 Stock"], 60],
  ],

  "Belric Crystal Fragment": [
    ["Corufell", 300],
    [["Corufell Barrel", "Corufell Receiver", "Corufell Handle"], 150],
    ["Steflos", 500],
    [["Steflos Barrel", "Steflos Receiver", "Steflos Stock"], 250],
  ],
  "Rania Crystal Fragment": [
    ["Corufell", 500],
    [["Corufell Barrel", "Corufell Receiver", "Corufell Handle"], 250],
    ["Steflos", 300],
    [["Steflos Barrel", "Steflos Receiver", "Steflos Stock"], 150],
  ],

  "Kullervo's Bane": [
    ["Rauta", 12],
    [["Rauta Barrel", "Rauta Receiver", "Rauta Stock"], 6],
  ],

  "Pathos Clamp": [[["Azothane", "Sun & Moon", "Syam", "Edun", "Sampotes", "Argo & Vel"], 60]],

  "Scuttler Husk": [
    [["Scyotid", "Spinnerex"], 48],
    [["Scyotid Barrel", "Scyotid Gauntlet"], 12],
    [["Spinnerex Blade", "Spinnerex String", "Spinnerex Handle"], 16],
    ["Thalys", 96],
  ],

  Stock: [
    ["Afentis", 60],
    [["Aegrit", "Slaytra"], 30],
  ],

  "Vessel Capillaries": [
    ["Onos", 360],
    ["Ruvox", 180],
    [["Ruvox Blade", "Ruvox Glove"], 45],
  ],

  "Vestigial Motes": [[["Evensong", "Cantare", "Harmony"], 300]],
};

export default blueprintExchange;
