import { ReadonlySignal, Signal, useComputed } from "@preact/signals";
import { useContext } from "preact/hooks";
import toposort from "toposort";
import { AppState } from "../AppState";
import { InventoryOptions } from "../inventory";
import { PublicExport } from "../publicExport";
import { ExportRecipe } from "../publicExport/schema";
import { humanName, sortWith } from "../util";
import BlueprintExchange from "./blueprintExchange";

export type CraftRequirement = {
  name: string;
  dependents: Set<string>;
  quantityTotal: number;
  quantityNeeded: number;
  batchSize: number;
  toplevel: boolean;
};

export class CraftList {
  private manifest: PublicExport;
  private options: InventoryOptions;
  private recipes: Record<string, ExportRecipe | undefined> = {};
  private _edges: [string, string][] = [];

  constructor(manifest: PublicExport, options: InventoryOptions, items: string[] = []) {
    this.manifest = manifest;
    this.options = options;
    items.forEach((it) => this.add(it));
  }

  get edges(): ReadonlyArray<[string, string]> {
    return this._edges;
  }

  getRecipe(uniqueName: string) {
    return (this.recipes[uniqueName] ??= this.manifest.findRecipe(uniqueName, !this.options.useInvasions));
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

    const tk = (k: string) => this.manifest.getKey(k.startsWith("Rauta ") ? k : `${k} Blueprint`);

    for (const dep in BlueprintExchange) {
      for (let [bps, quantity] of BlueprintExchange[dep]) {
        if (typeof bps === "string") bps = [bps];
        if (bps.map(tk).includes(uniqueName))
          regularItems.push({
            ItemType: this.manifest.getKey(dep),
            ItemCount: quantity,
            ProductCategory: "MiscItems",
          });
      }
    }

    if (recipe != null && recipe.consumeOnUse)
      regularItems.push({
        ItemType: recipe.uniqueName,
        ItemCount: 1,
        ProductCategory: "Items",
      });

    if (!uniqueName.endsWith("Blueprint")) {
      const { modular } = this.options;
      const modComponents = [];

      if (uniqueName.startsWith("/Lotus/Types/Vehicles/Hoverboard/HoverboardParts") && uniqueName.endsWith("Deck"))
        modComponents.push(modular.boardJet, modular.boardNose, modular.boardReactor);

      if (
        uniqueName.startsWith("/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels") ||
        uniqueName.startsWith("/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel")
      )
        modComponents.push(modular.gunGrip, modular.gunLoader);

      if (
        uniqueName.startsWith("/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip") ||
        uniqueName.startsWith("/Lotus/Weapons/Ostron/Melee/ModularMelee02/Tip") ||
        uniqueName.startsWith("/Lotus/Weapons/Ostron/Melee/ModularMeleeInfested/Tips")
      )
        modComponents.push(modular.zawGrip, modular.zawLink);

      if (
        uniqueName.startsWith("/Lotus/Weapons/Sentients/OperatorAmplifiers/Set1/Barrel") ||
        uniqueName.startsWith("/Lotus/Weapons/Sentients/OperatorAmplifiers/Set2/Barrel") ||
        uniqueName.startsWith("/Lotus/Weapons/Corpus/OperatorAmplifiers/Set1/Barrel")
      )
        modComponents.push(modular.ampBrace, modular.ampScaffold);

      regularItems.push(
        ...modComponents
          .filter((a) => a != "")
          .map((a) => ({ ItemType: a, ItemCount: 1, ProductCategory: "MiscItems" })),
      );
    }

    return regularItems;
  }

  flattened(ownedItems: Record<string, Signal<number>>) {
    const allItems: Record<string, CraftRequirement> = {};

    const addOrInsert = (item: ExportRecipe["ingredients"][0], toplevel: boolean, parent?: string) => {
      const { ItemType, ItemCount } = item;

      allItems[ItemType] ??= {
        name: humanName(ItemType, this.manifest),
        dependents: new Set(),
        toplevel: true,
        quantityNeeded: 0,
        quantityTotal: 0,
        batchSize: this.getRecipe(ItemType)?.num ?? 1,
      };

      if (parent != null && parent != "_root") allItems[ItemType].dependents.add(parent);
      allItems[ItemType].quantityTotal += ItemCount;
      allItems[ItemType].quantityNeeded += ItemCount;
      allItems[ItemType].toplevel = toplevel;

      return allItems[ItemType];
    };

    // iterate top down
    for (const key of toposort(this._edges)) {
      // if we run into a key that's already present, that means all of this item's dependents have been processed already, so this quantity is the final needed for the top-level list
      if (allItems[key] != null) {
        allItems[key].quantityNeeded = Math.max(0, allItems[key].quantityTotal - (ownedItems[key]?.value ?? 0));
        const craftsNeeded = Math.ceil(allItems[key].quantityNeeded / allItems[key].batchSize);
        for (const item of this.iterIngredients(key)) {
          addOrInsert({ ...item, ItemCount: item.ItemCount * craftsNeeded }, false, key);
        }
      } else {
        addOrInsert({ ItemType: key, ItemCount: 1, ProductCategory: "Items" }, true);
        for (const item of this.iterIngredients(key)) {
          addOrInsert(item, false, key);
        }
      }
    }

    delete allItems["_root"];

    const paired = Object.entries(allItems);
    return sortWith(paired, CraftList.sortKey);
  }

  static sortKey = (a: [string, CraftRequirement]) => [
    a[1].toplevel ? 0 : 1,
    this.categorize(a[0]),
    a[1].name.replace("[A] ", ""),
  ];

  static categorize = (a: string) => {
    if (a.endsWith("Blueprint")) return 150;
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

export function useCraftList(items: ReadonlySignal<string[]>, options: ReadonlySignal<InventoryOptions>): CraftData {
  const { manifest, ingredientsOwned } = useContext(AppState);
  const craftList = useComputed(() => new CraftList(manifest, options.value, items.value));

  const ingredientsFlat = useComputed(() => {
    console.log("calculating flat materials list...");
    const dt = performance.now();
    const flattened = craftList.value.flattened(ingredientsOwned.value);
    const dt2 = performance.now();
    console.log(`took ${dt2 - dt}ms`);
    return flattened;
  });

  return { craftList, ingredientsFlat };
}
