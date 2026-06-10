import { ReadonlySignal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { Set } from "immutable";
import { useContext } from "preact/hooks";
import toposort from "toposort";
import { AppState } from "..";
import { completed, Lazy, pending } from "../components/Deferred";
import { humanName, sortWith } from "../util";
import { ExportRecipe } from "./schema";
import { Wanifest } from "./wanifest";

export type CraftRequirement = {
  name: string;
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
    if (uniqueName in this.recipes) return this.recipes[uniqueName];

    return (this.recipes[uniqueName] = this.manifest.findRecipe(uniqueName, this.includeResearchComponents));
  }

  add(uniqueName: string, toplevel: boolean = true) {
    if (toplevel) this._edges.push(["<root>", uniqueName]);

    const recipe = this.getRecipe(uniqueName);
    if (recipe != null) {
      for (const { ItemType } of recipe.ingredients) {
        this._edges.push([uniqueName, ItemType]);
        this.add(ItemType, false);
      }
    }
  }

  flattened(ownedItems: Record<string, number>) {
    const allItems: Record<string, CraftRequirement & { recipe: ExportRecipe }> = {};

    const roots = Set(this._edges.filter((e) => e[0] == "<root>").map((e) => e[1]));

    const addOrInsert = (key: string, quantity: number) => {
      if (key in allItems) {
        allItems[key].quantityTotal += quantity;
        allItems[key].quantityNeeded += quantity;
        return;
      }

      const recipe = this.getRecipe(key);
      return (allItems[key] = {
        name: humanName(key, this.manifest),
        toplevel: roots.includes(key),
        quantityNeeded: quantity,
        quantityTotal: quantity,
        batchSize: recipe?.num ?? 1,
        recipe: recipe!,
      });
    };

    // iterate top down
    for (const key of toposort(this._edges)) {
      // if we run into a key that's already present, that means all of this item's dependents have been processed already, so this quantity is the final needed for the top-level list
      // so now we can safely round it up to the nearest batch size (though the rounding is only applied to the descendants, otherwise you get weird stuff like Exceptional Sentient Core requiring 3 Heart Nyth instead of 1)
      if (allItems[key] != null) {
        const { recipe } = allItems[key];
        // subtract owned items
        allItems[key].quantityNeeded = Math.max(0, allItems[key].quantityTotal - (ownedItems[key] ?? 0));
        if (recipe != null) {
          const batchSize = Math.ceil(allItems[key].quantityNeeded / recipe.num) * recipe.num;
          for (const { ItemType, ItemCount } of recipe.ingredients) {
            addOrInsert(ItemType, (ItemCount * batchSize) / recipe.num);
          }
        }
      } else {
        addOrInsert(key, 1);
        const recipe = this.getRecipe(key);
        if (recipe != null) {
          for (const { ItemType, ItemCount } of recipe.ingredients) {
            addOrInsert(ItemType, ItemCount);
          }
        }
      }
    }

    delete allItems["<root>"];

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
    void useInvasions.value;
    void items.value;
    craftList.value = pending();
    ingredientsFlat.value = pending();
    setTimeout(() => {
      console.log("assembling craft list...");
      craftList.value = completed(new CraftList(manifest, !useInvasions.value, items.value));
    });
  });

  useSignalEffect(() => {
    void ingredientsOwned.value;
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
