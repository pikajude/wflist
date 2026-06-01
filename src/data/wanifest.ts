import localforage from "localforage";
import { decompress } from "lzma1";
import { ExportGear, ExportRecipe, ExportResource, ExportWeapon } from "./schema";

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
  | "ExportSentinels"
  | "ExportSortieRewards"
  | "ExportUpgrades"
  | "ExportWarframes"
  | "ExportWeapons"
  | "Manifest";

type TypedExports = {
  Manifest: { uniqueName: string; textureLocation: string }[];
  ExportGear: ExportGear[];
  ExportWeapons: ExportWeapon[];
  ExportRecipes: ExportRecipe[];
  ExportResources: ExportResource[];
};

type Exports = Record<Exclude<ExportCategory, keyof TypedExports>, object> & TypedExports;

export class Wanifest {
  exports = {} as Exports;
  textures: { [name: string]: string } = {};
  names: { [uniqueName: string]: string } = {};

  private constructor() {}

  find_recipe = (name: string) => this.exports.ExportRecipes.find((c) => c.resultType == name);

  image_url = (name: string) => `http://content.warframe.com/PublicExport/${this.textures[name]}`;

  static async create() {
    const url = "https://origin.warframe.com/PublicExport/index_en.txt.lzma";

    const self = new Wanifest();

    const response = await fetch(url);
    const lines = new TextDecoder()
      .decode(decompress(await response.bytes()))
      .split(/\s+/m)
      .filter((s) => s.trim().length > 0)
      .map((l) => Wanifest.get_export_text(l));
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

  static async get_export_text(filename: string) {
    var existing = await localforage.getItem<string>(filename);
    if (existing != null) return existing;

    const src = `http://content.warframe.com/PublicExport/Manifest/${filename}`;
    const response = await fetch(src);
    const txt = await response.text();

    await localforage.setItem(filename, txt);
    return txt;
  }
}
