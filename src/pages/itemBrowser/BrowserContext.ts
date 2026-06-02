import { ReadonlySignal, Signal, useComputed, useSignal } from "@preact/signals";
import { List, Set } from "immutable";
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
} as const;

export type SelectedCategory = keyof typeof categoryMap;

export type TBrowserContext = {
  _allWeapons: ReadonlySignal<List<ExportWeapon>>;
  weapons: ReadonlySignal<Array<ExportWeapon>>;

  category: Signal<SelectedCategory>;

  options: {
    showImages: Signal<boolean>;
    showMastered: Signal<boolean>;
    useInvasions: Signal<boolean>;
    masteredWeapons: Signal<Set<string>>;
  };
};

const modularPattern = [
  "/Lotus/Types/Friendly/Pets/CreaturePets/CreaturePetParts/Deimos",
  "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts",
  "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts",
  "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeapon",
  "/Lotus/Types/Items/Deimos/WoundedInfested",
  "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts",
  "/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire",
  "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier",
  new RegExp("^/Lotus/Weapons/(Sentients|Corpus)/OperatorAmplifiers/Set./(Grip|Chassis)"),
  new RegExp("^/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet./(Clip|Handle)"),
  new RegExp("^/Lotus/Weapons/SolarisUnited/Primary/SUModularPrimarySet./(Clip|Handle)"),
  new RegExp("^/Lotus/Weapons/Infested/Pistols/InfKitGun/(Clip|Handle)"),
  new RegExp("^/Lotus/Weapons/Ostron/Melee/ModularMelee\\w+/(Balance|Handle)"),
  /PvPVariant/,
] as const;

const isModular = (weapon: ExportWeapon) =>
  modularPattern.some((p) => (typeof p == "string" ? weapon.uniqueName.startsWith(p) : weapon.uniqueName.match(p)));

const excludeModular = (weapons: ExportWeapon[]) => weapons.filter((w) => !isModular(w));

const BrowserContext = createContext({} as TBrowserContext);
export default BrowserContext;

export function createBrowserContext(): TBrowserContext {
  const { manifest } = useContext(AppState);
  const allWeapons = useSignal(List(excludeModular(manifest.exports["ExportWeapons"])));

  const urlHash = window.location.hash.length == 0 ? "#Primary" : window.location.hash.slice(1);
  const initialCategory = urlHash in categoryMap ? (urlHash as SelectedCategory) : "Primary";

  const category = useSignal<SelectedCategory>(initialCategory);

  const showImage = useStored("wfListShowImage", true);
  const showMastered = useStored("wfListShowMastered", true);
  const useInvasions = useStored("wfListUseInvasions", true);

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
          (category.value == "All" || categoryMap[category.value].includes(weapon.productCategory as never)) &&
          (showMastered.value || !masteredWeapons.value.get(weapon.uniqueName, false)),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .toArray(),
  );

  return {
    _allWeapons: allWeapons,
    weapons,
    category,

    options: {
      showImages: showImage,
      showMastered: showMastered,
      useInvasions: useInvasions,
      masteredWeapons: masteredWeapons,
    },
  };
}
