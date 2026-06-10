import { ReadonlySignal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { useContext } from "preact/hooks";
import toposort from "toposort";
import { AppState } from ".";
import { completed, Lazy, pending } from "../components/Deferred";
import { humanName, sortWith } from "../util";
import { ExportRecipe } from "./schema";
import { Wanifest } from "./wanifest";

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

export type CraftRequirement = {
  name: string;
  quantityTotal: number;
  quantityNeeded: number;
  batchSize: number;
  toplevel: boolean;
};

export class CraftList {
  private manifest: Wanifest;
  private invasion: boolean;
  items: CraftItem[] = [];

  constructor(manifest: Wanifest, invasion = true, items: string[] = []) {
    this.manifest = manifest;
    this.invasion = invasion;
    for (const it of items) this.add(it);
  }

  add(uniqueName: string) {
    const cr = new CraftRecipe(uniqueName);
    cr.resolve(this.manifest, this.invasion);
    this.items.push(new CraftItem(cr, 1, this.manifest));
  }

  flattened(ownedItems: Record<string, number>) {
    const allItems: Record<string, CraftRequirement & { recipe: ExportRecipe }> = {};

    const edges: Array<[string, string]> = [];

    // build graph
    const addEdges = (item: CraftItem) => {
      for (const req of item.recipe.requires) {
        edges.push([item.recipe.uniqueName, req.recipe.uniqueName]);
        addEdges(req);
      }
    };

    const roots = this.items.map((i) => i.recipe.uniqueName);

    for (const item of this.items) addEdges(item);

    const addOrInsert = (key: string, quantity: number) => {
      if (key in allItems) {
        allItems[key].quantityTotal += quantity;
        allItems[key].quantityNeeded += quantity;
        return;
      }

      var recipe = this.manifest.find_recipe(key);
      return (allItems[key] = {
        name: humanName(key, this.manifest),
        toplevel: roots.includes(key),
        quantityNeeded: quantity,
        quantityTotal: quantity,
        batchSize: recipe?.num ?? 1,
        recipe: recipe as any as ExportRecipe,
      });
    };

    for (const key of toposort(edges)) {
      if (allItems[key] != null) {
        const { recipe } = allItems[key];
        allItems[key].quantityNeeded = Math.max(0, allItems[key].quantityTotal - ownedItems[key]);
        if (recipe != null) {
          var batchSize = Math.ceil(allItems[key].quantityNeeded / recipe.num) * recipe.num;
          for (const { ItemType, ItemCount } of recipe.ingredients) {
            addOrInsert(ItemType, (ItemCount * batchSize) / recipe.num);
          }
        }
      } else {
        addOrInsert(key, 1);
        var recipe = this.manifest.find_recipe(key);
        if (recipe != null) {
          for (const { ItemType, ItemCount } of recipe.ingredients) {
            addOrInsert(ItemType, ItemCount);
          }
        }
      }
    }

    const paired = Object.entries(allItems);
    return sortWith(paired, CraftList.sortKey);
  }

  static sortKey = (a: [string, CraftRequirement]) => [a[1].toplevel ? 0 : 1, this.categorize(a[0]), a[1].name];

  static categorize = (a: string) => {
    if (a.startsWith("/Lotus/Types/Items/Gems")) return 0;
    if (a.startsWith("/Lotus/Types/Items/MiscItems") || a.startsWith("/Lotus/Types/Items/Research")) return 1;

    if (a.startsWith("/Lotus/Types/Recipes/Weapons/WeaponParts")) return 100;
    if (a.startsWith("/Lotus/Weapons")) return 200;

    return 10;
  };
}

export class CraftItem {
  recipe: CraftRecipe;
  name: string;
  quantity: number;

  constructor(recipe: CraftRecipe, quantity: number, manifest: Wanifest) {
    this.name = humanName(recipe.uniqueName, manifest);
    this.recipe = recipe;
    this.quantity = quantity;
  }
}

export class CraftRecipe {
  uniqueName: string;
  output = 1;
  requires: CraftItem[] = [];

  constructor(uniqueName: string) {
    this.uniqueName = uniqueName;
  }

  resolve(manifest: Wanifest, excludeInvasionMaterials: boolean, multiplier: number = 1) {
    if (ResourcesLegacyCraftable.includes(this.uniqueName)) return;
    if (excludeInvasionMaterials && InvasionResources.includes(this.uniqueName)) return;

    const recipe = manifest.find_recipe(this.uniqueName);
    if (recipe == null) return;

    this.output = recipe.num;
    multiplier /= this.output;

    for (const { ItemType, ItemCount } of recipe.ingredients) {
      const cr = new CraftRecipe(ItemType);
      cr.resolve(manifest, excludeInvasionMaterials, multiplier * ItemCount);
      this.requires.push(new CraftItem(cr, Math.ceil(multiplier * ItemCount), manifest));
    }
  }
}

export type CraftData = {
  craftList: ReadonlySignal<Lazy<CraftList>>;
  ingredientsFlat: ReadonlySignal<Lazy<ReturnType<CraftList["flattened"]>>>;
};

export function useCraftList(
  items: ReadonlySignal<string[]>,
  useInvasions: ReadonlySignal<boolean>,
  ingredientsOwned: Signal<Record<string, number>>,
): CraftData {
  const { manifest } = useContext(AppState);
  const craftList = useSignal<Lazy<CraftList>>(pending());
  const ingredientsFlat = useSignal<Lazy<ReturnType<CraftList["flattened"]>>>(pending());

  useSignalEffect(() => {
    useInvasions.value;
    items.value;
    craftList.value = pending();
    ingredientsFlat.value = pending();
    setTimeout(() => {
      console.log("assembling craft list...");
      craftList.value = completed(new CraftList(manifest, useInvasions.value, items.value));
    });
  });

  useSignalEffect(() => {
    ingredientsOwned.value;
    if (craftList.value.state == "done") {
      const ref_ = craftList.value.value;
      setTimeout(() => {
        console.log("calculating flat materials list...");
        ingredientsFlat.value = completed(ref_.flattened(ingredientsOwned.value));
      });
    }
  });

  return { craftList, ingredientsFlat };
}
