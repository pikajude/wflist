import { ReadonlySignal, Signal, useComputed, useSignal } from "@preact/signals";
import { List, Map, Set } from "immutable";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { useStored, useStoredWith } from "../../components/util";
import { AppState } from "../../data";
import { ExportWeapon } from "../../data/schema";
import allVaulted from "../../data/vaulted.json";

const categoryMap = {
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  All: [],
};

export type SelectedCategory = keyof typeof categoryMap;

export type BrowserWeapon = ExportWeapon & { archwing: boolean };

export type BrowserOptions = {
  showImages: boolean;
  showMastered: boolean;
  useInvasions: boolean;
};

export type TBrowserContext = {
  _allWeapons: ReadonlySignal<List<ExportWeapon>>;
  weapons: ReadonlySignal<Array<BrowserWeapon>>;

  category: Signal<SelectedCategory>;

  options: Signal<BrowserOptions>;
  masteredWeapons: Signal<Set<string>>;
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

  // kdrive
  "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts",

  // wtf is this? extra grimoire
  "/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire",

  // mote amp
  "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier",
  // other amp components
  new RegExp("^/Lotus/Weapons/(Sentients|Corpus)/OperatorAmplifiers/Set\\d+/(Grip|Chassis)"),

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

function isCategory(weapon: ExportWeapon, categories: string[]): boolean {
  if (categories.length == 0) return true;

  if (weapon.uniqueName.startsWith("/Lotus/Weapons/Ostron/Melee")) return categories.includes("Melee");

  if (
    weapon.uniqueName.startsWith("/Lotus/Weapons/Infested/Pistols/InfKitGun") ||
    weapon.uniqueName.includes("SUModular")
  )
    return categories.some((c) => c == "LongGuns" || c == "Pistols");

  if (
    weapon.uniqueName.startsWith("/Lotus/Weapons/Sentients/OperatorAmplifiers") ||
    weapon.uniqueName.startsWith("/Lotus/Weapons/Corpus/OperatorAmplifiers")
  )
    return categories.includes("OperatorAmps");

  return categories.includes(weapon.productCategory);
}

export function createBrowserContext(): TBrowserContext {
  const { manifest } = useContext(AppState);
  // dedup weapons. the export contains 3 identical copies of Mausolon. cause why not
  const allWeapons = useSignal(
    List(
      Map(manifest.exports["ExportWeapons"].filter((w) => !shouldExclude(w)).map((w) => [w.uniqueName, w])).values(),
    ),
  );

  const urlHash = window.location.hash.length == 0 ? "#All" : window.location.hash.slice(1);
  const initialCategory = urlHash in categoryMap ? (urlHash as SelectedCategory) : "All";

  const category = useSignal<SelectedCategory>(initialCategory);

  const options = useStored<BrowserOptions>("wfListFilters", {
    showImages: true,
    showMastered: true,
    useInvasions: true,
  });

  const masteredWeapons = useStoredWith<Set<string>>(
    "wfListMastered",
    (v) => Set(v == null ? [] : (JSON.parse(v) as string[])),
    (m) => JSON.stringify(m.toArray()),
  );

  const weapons = useComputed(() =>
    allWeapons.value
      .filter(
        (weapon) =>
          !allVaulted.includes(weapon.uniqueName) &&
          isCategory(weapon, categoryMap[category.value]) &&
          (options.value.showMastered || !masteredWeapons.value.get(weapon.uniqueName, false)),
      )
      .map((w) => {
        return {
          ...w,
          archwing: w.name.startsWith("<ARCHWING>"),
          name: w.name.replace("<ARCHWING> ", ""),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .toArray(),
  );

  return {
    _allWeapons: allWeapons,
    weapons,
    category,
    masteredWeapons,

    options,
  };
}

const BrowserContext = createContext({} as TBrowserContext);
export default BrowserContext;
