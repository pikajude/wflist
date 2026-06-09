import { ReadonlySignal, signal, Signal, useComputed, useSignal } from "@preact/signals";
import { List, Map } from "immutable";
import { createContext } from "preact";
import { useLocation } from "preact-iso";
import { useContext } from "preact/hooks";
import { AppState } from "../../data";
import { ExportWeapon } from "../../data/schema";
import allVaulted from "../../data/vaulted.json";
import { useStored } from "../util";

const categoryMap = {
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  All: [],
};

export type SelectedCategory = keyof typeof categoryMap | "";

export type WeaponEx = ExportWeapon & { archwing: boolean };

export type BrowserOptions = {
  showImages: boolean;
  showCrafted: boolean;
  useInvasions: boolean;
};

export type TBrowserContext = {
  weapons: ReadonlySignal<Array<WeaponEx>>;

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

function isCategory(weapon: ExportWeapon, categoryName: SelectedCategory): boolean {
  if (categoryName == "") return true;

  const categories = categoryMap[categoryName] as string[];

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
  const { manifest, masteredWeapons } = useContext(AppState);
  // dedup weapons. the export contains 3 identical copies of Mausolon. cause why not
  const allWeapons = useSignal(
    List(
      Map(manifest.exports["ExportWeapons"].filter((w) => !shouldExclude(w)).map((w) => [w.uniqueName, w])).values(),
    ),
  );

  const { query } = useLocation();
  const initialWanted = query["category"] ?? "All";
  const initialCategory = initialWanted in categoryMap ? (initialWanted as SelectedCategory) : "All";

  const category = useSignal<SelectedCategory>(initialCategory);

  const options = useStored<BrowserOptions>("wfListFilters", {
    showImages: true,
    showCrafted: true,
    useInvasions: true,
  });

  const weapons = useComputed(() =>
    allWeapons.value
      .filter(
        (weapon) =>
          !allVaulted.includes(weapon.uniqueName) &&
          isCategory(weapon, category.value) &&
          (options.value.showCrafted || !masteredWeapons.value.get(weapon.uniqueName, false)),
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
    weapons,
    category,
    options,
  };
}

const BrowserContext = createContext({
  category: signal(""),
  weapons: signal([]),
  options: signal({
    showImages: true,
    showCrafted: true,
    useInvasions: true,
  }),
} as TBrowserContext);
export default BrowserContext;
