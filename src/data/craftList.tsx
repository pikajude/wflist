import { human_name, HumanName, Thumbnail } from "../components/util";
import { InvasionResources, ResourcesLegacyCraftable } from "../pages/Weapons";
import { Manifest } from "./manifest";

export class CraftList {
  private manifest: Manifest;
  private invasion: boolean;
  items: CraftItem[] = [];

  constructor(manifest: Manifest, invasion = true, items: string[] = []) {
    this.manifest = manifest;
    this.invasion = invasion;
    for (const it of items) this.add(it);
  }

  add(uniqueName: string) {
    const cr = new CraftRecipe(uniqueName);
    cr.resolve(this.manifest, this.invasion);
    this.items.push(new CraftItem(cr, 1));
  }

  flattened() {
    const allItems: { [key: string]: [string, number] } = {};

    const insertItem = (item: CraftItem) => {
      if (!(item.recipe.uniqueName in allItems))
        allItems[item.recipe.uniqueName] = [
          human_name(item.recipe.uniqueName, this.manifest),
          0,
        ];

      allItems[item.recipe.uniqueName][1] += item.quantity;

      for (const req of item.recipe.requires) insertItem(req);
    };

    for (const item of this.items) insertItem(item);

    const paired = Object.entries(allItems);
    paired.sort((a, b) => {
      var quant = b[1][1] - a[1][1];
      if (quant == 0) return a[1][0].localeCompare(b[1][0]);
      return quant;
    });
    return paired;
  }

  toJSON() {
    return {
      items: this.items,
    };
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

  resolve(
    manifest: Manifest,
    excludeInvasionMaterials: boolean,
    multiplier: number = 1,
  ) {
    if (ResourcesLegacyCraftable.includes(this.uniqueName)) return;
    if (excludeInvasionMaterials && InvasionResources.includes(this.uniqueName))
      return;

    const recipe = manifest.exports.ExportRecipes.find(
      (r) => r.resultType == this.uniqueName,
    );
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
