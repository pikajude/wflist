import localforage from "localforage";
import { decompress } from "lzma1";
import ADVERSARY from "./adversary.json";
import { ExportGear, ExportRecipe, ExportResource, ExportSentinel, ExportWarframe, ExportWeapon } from "./schema";
import VAULT from "./vault.json";

export { ADVERSARY, VAULT };

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

type Exports = Record<Exclude<ExportCategory, keyof TypedExports>, unknown> & TypedExports;

export const ResourcesLegacyCraftable = [
  // no longer craftable (and also we wouldn't want to anyway, the item costs are preposterous)
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

  // permanently vaulted stuff
  "/Lotus/Powersuits/Excalibur/ExcaliburPrime",
];

// can be crafted one at a time via foundry but some players might not want to do that since you can get 3 from invasions
export const InvasionResources = [
  "/Lotus/Types/Items/Research/BioComponent",
  "/Lotus/Types/Items/Research/ChemComponent",
  "/Lotus/Types/Items/Research/EnergyComponent",
];

// unobtainable blueprints
export const BadRecipes = [
  "/Lotus/Types/Recipes/Weapons/CorpusHandcannonBlueprint",
  "/Lotus/Types/Recipes/Weapons/GrineerHandcannonBlueprint",
  "/Lotus/Types/Recipes/Weapons/GrineerCombatKnifeBlueprint",
  "/Lotus/Types/Recipes/Weapons/LowKatanaBlueprint",
  "/Lotus/Types/Recipes/Weapons/WeaponParts/SagekPrimeStockBlueprint",
];

export class PublicExport {
  exports = {} as Exports;
  textures: { [name: string]: string } = {};
  names: { [uniqueName: string]: string } = {};
  private nameKeys: { [name: string]: string } = {};
  private craftableItems: Set<string> = new Set();
  private vaultedItems: Set<string> = new Set();

  private constructor() {}

  findRecipe(name: string, includeResearchComponents: boolean) {
    if (ResourcesLegacyCraftable.includes(name)) return undefined;
    if (!includeResearchComponents && InvasionResources.includes(name)) return undefined;

    if (ADVERSARY.includes(name)) return undefined;

    const elig = this.exports.ExportRecipes.filter((r) => !BadRecipes.includes(r.uniqueName) && r.resultType == name);

    if (elig.length == 0) return undefined;
    if (elig.length == 1) return elig[0];

    console.warn(elig);
    throw new Error(`Multiple valid recipes for ${name}, please filter them`);
  }

  getKey(nameOrKey: string): string {
    if (!nameOrKey.startsWith("/Lotus") && nameOrKey in this.nameKeys) return this.nameKeys[nameOrKey];

    return nameOrKey;
  }

  imageUrl(name: string) {
    return `http://content.warframe.com/PublicExport/${this.textures[name]}`;
  }

  isCraftable(name: string) {
    return this.craftableItems.has(name);
  }

  isVaulted(name: string) {
    return this.vaultedItems.has(name);
  }

  static async create(langCode = "en") {
    const url = `https://origin.warframe.com/PublicExport/index_${langCode}.txt.lzma`;

    const self = new PublicExport();

    console.log(`PublicExport: fetching index`);
    const response = await fetch(url);
    const lines = new TextDecoder()
      .decode(decompress(await response.bytes()))
      .split(/\s+/m)
      .filter((s) => s.trim().length > 0)
      .map((l) => this.getExportText(l));
    for (const exp of await Promise.all(lines)) {
      const obj = JSON.parse(exp) as Exports;
      self.exports = { ...self.exports, ...obj };
    }

    for (const { uniqueName, textureLocation } of self.exports["Manifest"]) self.textures[uniqueName] = textureLocation;

    for (const obj of self.exports["ExportWeapons"]) {
      if (obj.uniqueName.startsWith("/Lotus/Types/Items/Deimos/WoundedInfested")) {
        obj.name = `Wounded ${obj.name}`;
      }
    }

    self.addNames(self.exports["ExportWarframes"], true);
    self.addNames(self.exports["ExportWeapons"], true);
    self.addNames(self.exports["ExportSentinels"], true);
    self.addNames(self.exports["ExportResources"]);
    self.addNames(self.exports["ExportGear"]);
    for (const { uniqueName, resultType } of self.exports["ExportRecipes"]) {
      const bpn = `${self.names[resultType]} Blueprint`;
      self.names[uniqueName] = bpn;
      self.nameKeys[bpn] = uniqueName;
    }

    for (const engName of VAULT) self.vaultedItems.add(self.nameKeys[engName]);

    return self;
  }

  private addNames(objects: { uniqueName: string; name: string }[], craftable?: boolean) {
    for (const { uniqueName, name } of objects) {
      if (craftable) this.craftableItems.add(uniqueName);
      this.addName(uniqueName, name);
    }
  }

  private addName(uniqueName: string, humanName: string) {
    if (humanName.length == 0) return;
    this.names[uniqueName] = humanName;
    if (humanName in this.nameKeys)
      console.warn(`Duplicate human name ${humanName} for ${uniqueName}, first was ${this.nameKeys[humanName]}`);
    else this.nameKeys[humanName] = uniqueName;
  }

  static async getExportText(filename: string) {
    const existing = await localforage.getItem<string>(filename);
    if (existing != null) return existing;

    const src = `http://content.warframe.com/PublicExport/Manifest/${filename}`;
    const response = await fetch(src);
    const txt = await response.text();

    await localforage.setItem(filename, txt);
    return txt;
  }
}
