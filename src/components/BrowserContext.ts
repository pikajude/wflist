import { computed, ReadonlySignal, signal, Signal } from "@preact/signals";
import { List, Map } from "immutable";
import { createContext } from "preact";
import { LocationHook } from "preact-iso";
import { ExportWarframe, ExportWeapon } from "../data/schema";
import { TState } from "../data/state";
import allVaulted from "../data/vaulted.json";
import { stored } from "../util";
import { BrowserOptions } from "./BrowserOptions";

const categoryMap = {
  Warframe: ["Suits", "SpaceSuits"],
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  Modular: ["Modular"],
  All: [],
};

export type SelectedCategory = keyof typeof categoryMap | "";

type Item = ExportWeapon | ExportWarframe;
export type ItemEx = Item & { archwing: boolean };

export type TBrowserContext = {
  items: ReadonlySignal<Array<ItemEx>>;
  category: Signal<SelectedCategory>;
  options: Signal<BrowserOptions>;
};

const excludedWeapons = [
  // exalted weapons
  "/Lotus/Powersuits",

  // moa/hound
  "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts",
  "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts",
  "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeapon",

  // vulp/predasite
  "/Lotus/Types/Friendly/Pets/CreaturePets/CreaturePetParts/Deimos",
  "/Lotus/Types/Items/Deimos/WoundedInfested",

  // wtf is this? extra grimoire
  "/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire",

  // mote amp
  "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier",
  // other amp components
  new RegExp("^/Lotus/Weapons/(Sentients|Corpus)/OperatorAmplifiers/Set\\d+/(Grip|Chassis)"),

  // kdrive
  new RegExp("^/Lotus/Types/Vehicles/Hoverboard/HoverboardParts.*(Engine|Front|Jet)$"),

  // kitgun components
  new RegExp(
    "^/Lotus/Weapons/SolarisUnited/(Secondary/SUModularSecondarySet|Primary/SUModularPrimarySet)\\d+/(Clip|Handle)",
  ),
  new RegExp("^/Lotus/Weapons/Infested/Pistols/InfKitGun/(Clip|Handle)"),

  // zaw components
  new RegExp("^/Lotus/Weapons/Ostron/Melee/ModularMelee\\w+/(Balance|Handle)"),
  /PvPVariant/,
] as const;

const shouldExclude = (weapon: ExportWeapon) =>
  excludedWeapons.some((p) => (typeof p == "string" ? weapon.uniqueName.startsWith(p) : weapon.uniqueName.match(p)));

function isCategory(item: Item, categoryName: SelectedCategory): boolean {
  if (categoryName == "") return true;

  const categories = categoryMap[categoryName] as string[];

  if (categories.length == 0) return true;

  if (
    item.uniqueName.startsWith("/Lotus/Weapons/Infested/Pistols/InfKitGun") ||
    item.uniqueName.includes("SUModular") ||
    item.uniqueName.includes("ModularMelee") ||
    item.uniqueName.startsWith("/Lotus/Weapons/Sentients/OperatorAmplifiers") ||
    item.uniqueName.startsWith("/Lotus/Weapons/Corpus/OperatorAmplifiers") ||
    item.uniqueName.startsWith("/Lotus/Types/Vehicles/Hoverboard/HoverboardParts")
  )
    return categories.includes("Modular");

  return categories.includes(item.productCategory);
}

export function createBrowserContext(appState: TState, location: LocationHook): TBrowserContext {
  const { manifest, craftedItems } = appState;

  const ws: Item[] = [
    ...manifest.exports["ExportWeapons"].filter((w) => !shouldExclude(w)),
    ...manifest.exports["ExportWarframes"],
  ];

  // dedup items. the export contains 3 identical copies of Mausolon. cause why not
  const allItems = signal(List(Map(ws.map((w) => [w.uniqueName, w])).values()));

  const { query } = location;
  const initialWanted = query["category"] ?? "All";
  const initialCategory = initialWanted in categoryMap ? (initialWanted as SelectedCategory) : "All";

  const category = signal<SelectedCategory>(initialCategory);

  const options = stored("wfListFilters", BrowserOptions);

  const weapons = computed(() =>
    allItems.value
      .toArray()
      .filter(
        (item) =>
          isCategory(item, category.value) &&
          !(options.value.hideVaulted && allVaulted.includes(item.uniqueName)) &&
          !(options.value.hideCrafted && craftedItems.value.get(item.uniqueName, false)),
      )
      .map((w) => ({
        ...w,
        archwing: w.name.startsWith("<ARCHWING>"),
        name: w.name.replace("<ARCHWING> ", ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  return {
    items: weapons,
    category,
    options,
  };
}

const BrowserContext = createContext<TBrowserContext>({
  category: signal(""),
  items: signal([]),
  options: stored("wfListFilters", BrowserOptions),
});
export default BrowserContext;
