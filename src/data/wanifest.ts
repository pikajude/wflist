import localforage from "localforage";
import { decompress } from "lzma1";
import { ExportGear, ExportRecipe, ExportResource, ExportSentinel, ExportWarframe, ExportWeapon } from "./schema";

export type ExportCategory =
  | "ExportAbilities"
  | "ExportAvionics"
  | "ExportCustoms"
  | "ExportDrones"
  | "ExportFlavour"
  | "ExportFocusUpgrades"
  | "ExportFusionBundles"
  | "ExportGear"
  | "ExportIntrinsics"
  | "ExportKeys"
  | "ExportModSet"
  | "ExportNightwave"
  | "ExportOther"
  | "ExportRailjack"
  | "ExportRailjackWeapons"
  | "ExportRecipes"
  | "ExportRegions"
  | "ExportRelicArcane"
  | "ExportResources"
  | "ExportSortieRewards"
  | "ExportUpgrades"
  | "ExportWeapons"
  | "Manifest";

type TypedExports = {
  Manifest: { uniqueName: string; textureLocation: string }[];
  ExportGear: ExportGear[];
  ExportWeapons: ExportWeapon[];
  ExportRecipes: ExportRecipe[];
  ExportResources: ExportResource[];
  ExportSentinels: ExportSentinel[];
  ExportWarframes: ExportWarframe[];
};

type Exports = Record<Exclude<ExportCategory, keyof TypedExports>, object> & TypedExports;

// apparently planet-specific rare items used to be craftable in exchange for a ridiculous quantity of common stuff
export const ResourcesLegacyCraftable = [
  "/Lotus/Types/Items/MiscItems/Morphic",
  "/Lotus/Types/Items/MiscItems/Neurode",
  "/Lotus/Types/Items/MiscItems/OrokinCell",
  "/Lotus/Types/Items/MiscItems/ControlModule",
  "/Lotus/Types/Items/MiscItems/NeuralSensor",
  "/Lotus/Types/Items/MiscItems/Gallium",
  "/Lotus/Types/Items/RailjackMiscItems/CubicsRailjackItem",
  "/Lotus/Types/Items/RailjackMiscItems/CarbidesRailjackItem",
  "/Lotus/Types/Items/RailjackMiscItems/IsosRailjackItem",
  "/Lotus/Types/Items/RailjackMiscItems/GallosRailjackItem",
];

export const InvasionResources = [
  "/Lotus/Types/Items/Research/BioComponent",
  "/Lotus/Types/Items/Research/ChemComponent",
  "/Lotus/Types/Items/Research/EnergyComponent",
];

export class Wanifest {
  exports = {} as Exports;
  textures: { [name: string]: string } = {};
  names: { [uniqueName: string]: string } = {};

  private constructor() {}

  findRecipe = (name: string, includeResearchComponents: boolean) => {
    if (ResourcesLegacyCraftable.includes(name)) return undefined;
    if (!includeResearchComponents && InvasionResources.includes(name)) return undefined;

    return this.exports.ExportRecipes.find((c) => c.resultType == name);
  };

  imageUrl = (name: string) => `http://content.warframe.com/PublicExport/${this.textures[name]}`;

  static async create() {
    const url = "https://origin.warframe.com/PublicExport/index_en.txt.lzma";

    const self = new Wanifest();

    const response = await fetch(url);
    const lines = new TextDecoder()
      .decode(decompress(await response.bytes()))
      .split(/\s+/m)
      .filter((s) => s.trim().length > 0)
      .map((l) => Wanifest.getExportText(l));
    for (const exp of await Promise.all(lines)) {
      const obj = JSON.parse(exp) as Exports;
      self.exports = { ...self.exports, ...obj };
    }

    for (const { uniqueName, textureLocation } of self.exports["Manifest"]) {
      self.textures[uniqueName] = textureLocation;
    }

    for (const k of self.exports["ExportWeapons"]) self.names[k.uniqueName] = k.name;
    for (const k of self.exports["ExportResources"]) self.names[k.uniqueName] = k.name;
    for (const k of self.exports["ExportGear"]) self.names[k.uniqueName] = k.name;

    return self;
  }

  static async getExportText(filename: string) {
    var existing = await localforage.getItem<string>(filename);
    if (existing != null) return existing;

    const src = `http://content.warframe.com/PublicExport/Manifest/${filename}`;
    const response = await fetch(src);
    const txt = await response.text();

    await localforage.setItem(filename, txt);
    return txt;
  }
}
