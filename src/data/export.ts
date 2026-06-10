import localforage from "localforage";
import { decompress } from "lzma1";

export const ALL_EXPORTS = [
  "Customs",
  "Drones",
  "Flavour",
  "FusionBundles",
  "Gear",
  "Keys",
  "Recipes",
  "Regions",
  "RelicArcane",
  "Resources",
  "Sentinels",
  "SortieRewards",
  "Upgrades",
  "Warframes",
  "Weapons",
] as const;

const tmp = [...ALL_EXPORTS];
export type Export = (typeof tmp)[0];

export async function fetchIndex() {
  console.log("fetching index...");

  const url = "https://origin.warframe.com/PublicExport/index_en.txt.lzma";

  const response = await fetch(url);

  const lines = new TextDecoder().decode(decompress(await response.bytes()));

  const entries = Object.fromEntries(ALL_EXPORTS.map((e) => [e, ""])) as {
    [key in Export]: string;
  };

  lines.split(/\s+/m).forEach((line) => {
    const start = line.split("!")[0];
    for (const i of tmp) {
      if (start.startsWith(`Export${i}`)) {
        entries[i] = line;
        break;
      }
    }
  });

  return entries;
}

export async function fetchExport(name: string) {
  const cached = await localforage.getItem<string>(name);
  if (cached != null) return cached;

  const src = `http://content.warframe.com/PublicExport/Manifest/${name}`;

  console.log(`fetching ${name}...`);

  const response = await fetch(src);
  const txt = await response.text();

  await localforage.setItem(name, txt);
  return txt;
}
