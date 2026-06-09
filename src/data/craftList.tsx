import { ReadonlySignal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { useContext } from "preact/hooks";
import { AppState } from ".";
import { completed, Lazy, pending } from "../components/Deferred";
import { humanName, HumanName, Texture } from "../components/util";
import cx from "../style";
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
  quantity: number;
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

  flattened(ownedItemsIn: Record<string, number>) {
    const allItems: Record<string, CraftRequirement> = {};

    const ownedItems = { ...ownedItemsIn };

    const insertItem = (item: CraftItem, toplevel = false, multiplier = 1) => {
      const uniqueName = item.recipe.uniqueName;

      if (!(uniqueName in allItems))
        allItems[uniqueName] = {
          name: humanName(uniqueName, this.manifest),
          quantity: 0,
          toplevel,
        };
      if (!(uniqueName in ownedItems)) ownedItems[uniqueName] = 0;

      var adjQuantity = Math.ceil(item.quantity * multiplier);

      var ownedQuantity = Math.min(adjQuantity, ownedItems[uniqueName]);
      var remainingNeeded = adjQuantity - ownedQuantity;
      var newMulti = multiplier * (remainingNeeded / adjQuantity);

      ownedItems[uniqueName] -= ownedQuantity;
      allItems[uniqueName].quantity += remainingNeeded;

      if (remainingNeeded > 0) for (const req of item.recipe.requires) insertItem(req, false, newMulti);
    };

    for (const item of this.items) insertItem(item, true);

    const paired = Object.entries(allItems);
    return paired.sort(CraftList.orderIngredients);
  }

  static sortKey = (a: [string, CraftRequirement]) => [!a[1].toplevel, this.categorize(a[0]), a[1].name];

  static orderIngredients = (a: [string, CraftRequirement], b: [string, CraftRequirement]): number => {
    var ak = this.sortKey(a);
    var bk = this.sortKey(b);

    if (ak > bk) return 1;
    if (ak < bk) return -1;

    return 0;
  };

  static categorize = (a: string) => {
    if (a.startsWith("/Lotus/Types/Items/Gems")) return 0;
    if (a.startsWith("/Lotus/Types/Items/MiscItems") || a.startsWith("/Lotus/Types/Items/Research")) return 1;

    if (a.startsWith("/Lotus/Types/Recipes/Weapons/WeaponParts") || a.startsWith("/Lotus/Weapons")) return 200;

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
