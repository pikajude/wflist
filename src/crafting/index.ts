import { ReadonlySignal, Signal, useComputed } from "@preact/signals";
import { useContext } from "preact/hooks";
import toposort from "toposort";
import { AppState } from "../AppState";
import { InventoryOptions } from "../inventory";
import { typedKeys } from "../inventory/category";
import { PublicExport } from "../publicExport";
import { ExportRecipe } from "../publicExport/schema";
import { humanName } from "../util";
import BlueprintExchange from "./blueprintExchange.json";
import DeimosExchange from "./deimosExchange.json";

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
  private recipes: Record<string, { v: ExportRecipe | undefined }> = {};
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
    return (this.recipes[uniqueName] ??= { v: this.manifest.findRecipe(uniqueName, !this.options.useInvasions) }).v;
  }

  getBatchSize(uniqueName: string) {
    // nitain can only be bought as 5x for 15 creds
    if (uniqueName == "/Lotus/Types/Items/MiscItems/Alertium") return 5;

    return this.getRecipe(uniqueName)?.num ?? 1;
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

    for (const dep of typedKeys(BlueprintExchange)) {
      for (let [bps, quantity] of BlueprintExchange[dep] as [string | string[], number][]) {
        if (typeof bps === "string") bps = [bps];
        if (bps.includes(uniqueName))
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

      if (uniqueName.startsWith("/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetHead"))
        modComponents.push(modular.moaBracket, modular.moaCore, modular.moaGyro);

      if (uniqueName.endsWith("InfestedCatbrowPetPowerSuit"))
        modComponents.push(modular.vulpAntigen, modular.vulpMutagen);

      if (uniqueName.endsWith("PredatorKubrowPetPowerSuit"))
        modComponents.push(modular.predAntigen, modular.predMutagen);

      regularItems.push(
        ...modComponents
          .filter((a) => a != "")
          .map((a) => ({ ItemType: a, ItemCount: 1, ProductCategory: "MiscItems" })),
      );
    }

    if (uniqueName in DeimosExchange)
      regularItems.push({
        ItemType: DeimosExchange[uniqueName as keyof typeof DeimosExchange],
        ItemCount: 1,
        ProductCategory: "MiscItems",
      });
    else if (uniqueName.endsWith("CatbrowPetPowerSuit") || uniqueName.endsWith("KubrowPetPowerSuit"))
      regularItems.push({
        ItemType: "/Lotus/Types/Game/KubrowPet/EggHatcher",
        ItemCount: 1,
        ProductCategory: "MiscItems",
      });

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
        batchSize: this.getBatchSize(ItemType),
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

    return Object.entries(allItems);
  }
}

export type CraftData = {
  craftList: ReadonlySignal<CraftList>;
  ingredients: ReadonlySignal<ReturnType<CraftList["flattened"]>>;
};

export function useCraftList(items: ReadonlySignal<string[]>, options: ReadonlySignal<InventoryOptions>): CraftData {
  const { manifest, ingredientsOwned } = useContext(AppState);
  const craftList = useComputed(() => new CraftList(manifest, options.value, items.value));

  const ingredients = useComputed(() => {
    const dt = performance.now();
    const flattened = craftList.value.flattened(ingredientsOwned.value);
    const dt2 = performance.now();
    console.log(`material list calculation took ${dt2 - dt}ms`);
    return flattened;
  });

  return { craftList, ingredients };
}
