export type BlueprintExchange = { [resource: string]: [string | string[], number][] };

const cns = (name: string) => [`${name} Chassis`, `${name} Neuroptics`, `${name} Systems`];
const brs = (name: string) => [`${name} Barrel`, `${name} Receiver`, `${name} Stock`];

const blueprintExchange: BlueprintExchange = {
  Atramentum: [
    ["Follie", 1200],
    [cns("Follie"), 400],
    ["Enkaus", 1200],
    [brs("Enkaus"), 400],
  ],

  "Beating Heartstrings": [
    ["Temple", 195],
    [cns("Temple"), 65],
    ["Riot-848", 120],
    [brs("Riot-848"), 60],
  ],

  "Belric Crystal Fragment": [
    ["Citrine", 500],
    [["Citrine Chassis", "Citrine Neuroptics"], 350],
    ["Citrine Systems", 300],
    ["Corufell", 300],
    [["Corufell Barrel", "Corufell Receiver", "Corufell Handle"], 150],
    ["Steflos", 500],
    [brs("Steflos"), 250],
  ],
  "Rania Crystal Fragment": [
    ["Citrine", 500],
    [cns("Citrine"), 350],
    ["Corufell", 500],
    [["Corufell Barrel", "Corufell Receiver", "Corufell Handle"], 250],
    ["Steflos", 300],
    [brs("Steflos"), 150],
  ],

  "Kullervo's Bane": [
    ["Kullervo", 15],
    [cns("Kullervo"), 9],
    ["Rauta", 12],
    [brs("Rauta"), 6],
  ],

  "Pathos Clamp": [[["Azothane", "Sun & Moon", "Syam", "Edun", "Sampotes", "Argo & Vel"], 60]],

  "Scuttler Husk": [
    ["Oraxia", 60],
    [cns("Oraxia"), 20],
    [["Scyotid", "Spinnerex"], 48],
    [["Scyotid Barrel", "Scyotid Gauntlet"], 12],
    [["Spinnerex Blade", "Spinnerex String", "Spinnerex Handle"], 16],
    ["Thalys", 96],
  ],

  Stock: [
    ["Styanax", 90],
    [cns("Styanax"), 60],
    ["Afentis", 60],
    [["Aegrit", "Slaytra"], 30],
  ],

  "Vessel Capillaries": [
    ["Dante", 270],
    [cns("Dante"), 90],
    ["Onos", 360],
    ["Ruvox", 180],
    [["Ruvox Blade", "Ruvox Glove"], 45],
  ],

  "Vestigial Motes": [
    // jade bp is a quest reward, so not added here
    [cns("Jade"), 150],
    [["Evensong", "Cantare", "Harmony"], 300],
  ],
};

export default blueprintExchange;
