import z from "zod";
import { Item } from ".";

export const Categories = {
  All: [] as string[],
  Warframe: ["Suits", "SpaceSuits"],
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  Companion: ["KubrowPets", "Sentinels"],
  Archwing: ["SpaceSuits", "SpaceGuns", "SpaceMelee"],
  Modular: ["Modular"],
};

export function typedKeys<T extends object>(object: T) {
  return Object.keys(object) as (keyof typeof object)[];
}

const [k1, ...krest] = typedKeys(Categories);

export const Category = z.enum([k1, ...krest]).default("All");
export type Category = z.infer<typeof Category>;

export function categorize(item: Item): string {
  if (
    item.uniqueName.startsWith("/Lotus/Weapons/Infested/Pistols/InfKitGun") ||
    item.uniqueName.includes("SUModular") ||
    item.uniqueName.includes("ModularMelee") ||
    item.uniqueName.startsWith("/Lotus/Weapons/Sentients/OperatorAmplifiers") ||
    item.uniqueName.startsWith("/Lotus/Weapons/Corpus/OperatorAmplifiers") ||
    item.uniqueName.startsWith("/Lotus/Types/Vehicles/Hoverboard/HoverboardParts")
  )
    return "Modular";

  if (item.uniqueName.startsWith("/Lotus/Powersuits/EntratiMech")) return "Suits";

  if (
    item.uniqueName.startsWith("/Lotus/Types/Friendly/Pets") ||
    item.uniqueName.startsWith("/Lotus/Types/Items/Deimos/WoundedInfested")
  )
    return "Sentinels";

  return item.productCategory;
}

export const ExcludedWeaponPattern = [
  // exalted weapons
  "/Lotus/Powersuits",

  // moa/hound
  "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeapon",
  "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MeleeMoaPet",
  new RegExp("^/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPet(Leg|Engine|Payload).*$"),
  new RegExp("^/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPart(Body|Legs|Tail).$"),

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

export const isExcluded = (weapon: Item) =>
  ExcludedWeaponPattern.some((p) =>
    typeof p == "string" ? weapon.uniqueName.startsWith(p) : weapon.uniqueName.match(p),
  );
