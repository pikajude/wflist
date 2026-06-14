import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { useContext } from "preact/hooks";
import toposort from "toposort";
import { humanName, sortWith } from "../util";
import BlueprintExchange from "./blueprintExchange";
import { ExportRecipe } from "./schema";
import { AppState } from "./state";
import { Wanifest } from "./wanifest";

export type CraftRequirement = {
  name: string;
  dependents: Set<string>;
  quantityTotal: number;
  quantityNeeded: number;
  batchSize: number;
  toplevel: boolean;
};

export class CraftList {
  private manifest: Wanifest;
  private includeResearchComponents: boolean;
  private recipes: Record<string, ExportRecipe | undefined> = {};
  private _edges: [string, string][] = [];

  constructor(manifest: Wanifest, includeResearchComponents = false, items: string[] = []) {
    this.manifest = manifest;
    this.includeResearchComponents = includeResearchComponents;
    for (const it of items) this.add(it);
  }

  get edges(): ReadonlyArray<[string, string]> {
    return this._edges;
  }

  getRecipe(uniqueName: string) {
    return (this.recipes[uniqueName] ??= this.manifest.findRecipe(uniqueName, this.includeResearchComponents));
  }

  add(uniqueName: string, toplevel: boolean = true) {
    if (toplevel) this._edges.push(["_root", uniqueName]);

    for (const { ItemType } of this.iterIngredients(uniqueName)) {
      this._edges.push([uniqueName, ItemType]);
      this.add(ItemType, false);
    }
  }

  iterIngredients(uniqueName: string): ExportRecipe["ingredients"] {
    const recipe = this.getRecipe(uniqueName);
    const regularItems = [...(recipe?.ingredients ?? [])];

    for (const dep in BlueprintExchange) {
      for (const [bps, quantity] of BlueprintExchange[dep]) {
        const matches =
          typeof bps === "string"
            ? this.manifest.getKey(bps) == uniqueName
            : bps.some((b) => this.manifest.getKey(b) == uniqueName);
        if (matches)
          regularItems.push({
            ItemType: this.manifest.getKey(dep),
            ItemCount: quantity,
            ProductCategory: "MiscItems",
          });
      }
    }

    return regularItems;
  }

  flattened(ownedItems: Record<string, number>) {
    const allItems: Record<string, CraftRequirement> = {};

    const addOrInsert = (key: string, quantity: number, toplevel: boolean, parent?: string) => {
      allItems[key] ??= {
        name: humanName(key, this.manifest),
        dependents: new Set(),
        toplevel: true,
        quantityNeeded: 0,
        quantityTotal: 0,
        batchSize: this.getRecipe(key)?.num ?? 1,
      };

      if (parent != null && parent != "_root") allItems[key].dependents.add(parent);
      allItems[key].quantityTotal += quantity;
      allItems[key].quantityNeeded += quantity;
      allItems[key].toplevel = toplevel;

      return allItems[key];
    };

    // iterate top down
    for (const key of toposort(this._edges)) {
      // if we run into a key that's already present, that means all of this item's dependents have been processed already, so this quantity is the final needed for the top-level list
      if (allItems[key] != null) {
        allItems[key].quantityNeeded = Math.max(0, allItems[key].quantityTotal - (ownedItems[key] ?? 0));
        const craftsNeeded = Math.ceil(allItems[key].quantityNeeded / allItems[key].batchSize);
        for (const { ItemType, ItemCount } of this.iterIngredients(key)) {
          addOrInsert(ItemType, ItemCount * craftsNeeded, false, key);
        }
      } else {
        addOrInsert(key, 1, true);
        for (const { ItemType, ItemCount } of this.iterIngredients(key)) {
          addOrInsert(ItemType, ItemCount, false, key);
        }
      }
    }

    delete allItems["_root"];

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

export type CraftData = {
  craftList: ReadonlySignal<CraftList>;
  ingredientsFlat: ReadonlySignal<ReturnType<CraftList["flattened"]>>;
};

export function useCraftList(items: ReadonlySignal<string[]>, useInvasions: ReadonlySignal<boolean>): CraftData {
  const { manifest, ingredientsOwned } = useContext(AppState);
  const craftList = useComputed(() => new CraftList(manifest, !useInvasions.value, items.value));
  const ingredientsFlat = useSignal<ReturnType<CraftList["flattened"]>>([]);

  useSignalEffect(() => {
    const cl = craftList.value;
    const ing = ingredientsOwned.value;
    setTimeout(() => {
      console.log("calculating flat materials list...");
      ingredientsFlat.value = cl.flattened(ing);
    });
  });

  return { craftList, ingredientsFlat };
}
