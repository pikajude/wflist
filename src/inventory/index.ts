import { computed, ReadonlySignal, signal, Signal } from "@preact/signals";
import { Map } from "immutable";
import { createContext } from "preact";
import { LocationHook } from "preact-iso";
import z from "zod";
import { TAppState } from "../AppState";
import { ADVERSARY } from "../publicExport";
import { ExportWarframe, ExportWeapon } from "../publicExport/schema";
import { stored } from "../util/storage";

const categoryMap = {
  Warframe: ["Suits", "SpaceSuits"],
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  Modular: ["Modular"],
  All: [],
};

export type SelectedCategory = keyof typeof categoryMap | "";

export const InventoryOptions = z
  .object({
    showImages: z.boolean().default(true),
    hideCrafted: z.boolean().default(true),
    hideVaulted: z.boolean().default(true),
    useInvasions: z.boolean().default(true),
    modular: z
      .object({
        ampBrace: z.string().default(""),
        ampScaffold: z.string().default(""),
        gunGrip: z.string().default(""),
        boardNose: z.string().default(""),
        boardJet: z.string().default(""),
        boardReactor: z.string().default(""),
        gunLoader: z.string().default(""),
        zawGrip: z.string().default(""),
        zawLink: z.string().default(""),
      })
      .prefault({}),
  })
  .prefault({});

export type InventoryOptions = z.output<typeof InventoryOptions>;

type Item = ExportWeapon | ExportWarframe;
export type ItemEx = Item & { archwing: boolean };

export type TInventoryState = {
  items: ReadonlySignal<Array<ItemEx>>;
  category: Signal<SelectedCategory>;
  options: Signal<InventoryOptions>;
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

  // sentinel weapons can't be crafted
  "/Lotus/Types/Sentinels/SentinelWeapons",

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

const shouldExclude = (weapon: ExportWeapon | ExportWarframe) =>
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

  if (item.uniqueName.startsWith("/Lotus/Powersuits/EntratiMech")) return categories.includes("Suits");

  return categories.includes(item.productCategory);
}

const PermaVaulted = [
  "/Lotus/Powersuits/Excalibur/ExcaliburPrime",
  "/Lotus/Weapons/Tenno/Pistol/LatoPrime",
  "/Lotus/Weapons/Tenno/Melee/LongSword/SkanaPrime",
];

export function createInventoryState(appState: TAppState, location: LocationHook): TInventoryState {
  const { manifest, craftedItems } = appState;

  const ws: Item[] = [
    ...manifest.exports["ExportWeapons"].filter((w) => !shouldExclude(w) && !ADVERSARY.includes(w.uniqueName)),
    ...manifest.exports["ExportWarframes"],
  ].filter((w) => !PermaVaulted.includes(w.uniqueName));

  // dedup items. the export contains 3 identical copies of Mausolon. cause why not
  const allItems = Array.from(Map(ws.map((w) => [w.uniqueName, w])).values());

  const { query } = location;
  const initialWanted = query["category"] ?? "All";
  const initialCategory = initialWanted in categoryMap ? (initialWanted as SelectedCategory) : "All";

  const category = signal<SelectedCategory>(initialCategory);

  const options = stored("wfListFilters", InventoryOptions);

  const items = computed(() =>
    allItems
      .filter(
        (item) =>
          isCategory(item, category.value) &&
          !(options.value.hideVaulted && manifest.isVaulted(item.uniqueName)) &&
          !(options.value.hideCrafted && craftedItems.value.has(item.uniqueName)),
      )
      .map((w) => ({
        ...w,
        archwing: w.name.startsWith("<ARCHWING>"),
        name: w.name.replace("<ARCHWING> ", ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  return {
    items,
    category,
    options,
  };
}

export const InventoryState = createContext<TInventoryState>({
  category: signal(""),
  items: signal([]),
  options: stored("wfListFilters", InventoryOptions),
});
