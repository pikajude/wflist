import { ReadonlySignal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { useContext } from "preact/hooks";
import toposort from "toposort";
import { AppState } from ".";
import { completed, Lazy, pending } from "../components/Deferred";
import cx from "../style";
import { humanName, HumanName, sortWith, Texture } from "../util";
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
    const allItems: Record<string, CraftRequirement> = {};

    const edges: Array<[string, string]> = [];

    // flatten recipe tree into a list
    const insertItem = (item: CraftItem, toplevel = false) => {
      const uniqueName = item.recipe.uniqueName;

      if (!(uniqueName in allItems))
        allItems[uniqueName] = {
          name: humanName(uniqueName, this.manifest),
          quantityTotal: 0,
          quantityNeeded: 0,
          batchSize: item.recipe.output,
          toplevel,
        };
      else allItems[uniqueName].toplevel = toplevel;
      if (!(uniqueName in ownedItems)) ownedItems[uniqueName] = 0;

      allItems[uniqueName].quantityTotal += item.quantity;

      for (const req of item.recipe.requires) {
        edges.push([uniqueName, req.recipe.uniqueName]);
        insertItem(req);
      }
    };

    for (const item of this.items) insertItem(item, true);

    // iterate over finalized list, round up quantities of items where recipe output != 1
    // this can't be done in the previous step since it would overcount every instance of, e.g., single gemstones which are a very common crafting requirement
    for (const key of toposort(edges)) {
      if (allItems[key].quantityTotal % allItems[key].batchSize != 0) {
        var batchedQuantity =
          Math.ceil((allItems[key].quantityTotal - ownedItems[key]) / allItems[key].batchSize) *
          allItems[key].batchSize;
        var itemRecipe = this.manifest.find_recipe(key);
        if (itemRecipe != null) {
          for (const { ItemCount, ItemType } of itemRecipe.ingredients) {
            allItems[ItemType].quantityTotal = (batchedQuantity * ItemCount) / allItems[key].batchSize;
          }
        }
      }
    }

    for (var key in allItems) allItems[key].quantityNeeded = Math.max(0, allItems[key].quantityTotal - ownedItems[key]);

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

export function ShowCraftList({ list }: { list: CraftItem[] }) {
  return (
    <div className={cx("grid")}>
      {list.map((i, v) => (
        <ShowCraftItem key={`${i.recipe.uniqueName}${v}`} item={i} />
      ))}
    </div>
  );
}

export function ShowCraftItem(props: { item: CraftItem }) {
  const { item } = props;

  return (
    <>
      <div className={cx("g-col-3")}>
        <Texture id={item.recipe.uniqueName} width="32px" />
        {HumanName(item.recipe.uniqueName)} x{item.quantity}
      </div>
      <div className={cx("g-col-9")}>
        <ShowCraftList list={item.recipe.requires} />
      </div>
    </>
  );
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
