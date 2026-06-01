import { human_name, HumanName, Thumbnail } from "../components/util";
import { InvasionResources, ResourcesLegacyCraftable } from "../pages/Weapons";
import { Wanifest } from "./wanifest";

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
    this.items.push(new CraftItem(cr, 1));
  }

  flattened(ownedItemsIn: Record<string, number>) {
    const allItems: Record<string, CraftRequirement> = {};

    const ownedItems = { ...ownedItemsIn };

    const insertItem = (item: CraftItem, toplevel = false, multiplier = 1) => {
      const uniqueName = item.recipe.uniqueName;

      if (!(uniqueName in allItems))
        allItems[uniqueName] = {
          name: human_name(uniqueName, this.manifest),
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
    paired.sort((a, b) => (a[1].toplevel ? -1 : b[1].toplevel ? 1 : a[1].name.localeCompare(b[1].name)));
    return paired;
  }
}

export class CraftItem {
  recipe: CraftRecipe;
  quantity: number;

  constructor(recipe: CraftRecipe, quantity: number) {
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
      this.requires.push(new CraftItem(cr, Math.ceil(multiplier * ItemCount)));
    }
  }
}

export function ShowCraftList({ list }: { list: CraftItem[] }) {
  return (
    <ul>
      {list.map((i, v) => (
        <ShowCraftItem key={`${i.recipe.uniqueName}${v}`} item={i} />
      ))}
    </ul>
  );
}

export function ShowCraftItem(props: { item: CraftItem }) {
  const { item } = props;

  return (
    <li>
      <p>
        <Thumbnail id={item.recipe.uniqueName} width="32px" />
        {HumanName(item.recipe.uniqueName)} x{item.quantity}
      </p>
      <ShowCraftList list={item.recipe.requires} />
    </li>
  );
}
