import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { Set } from "immutable";
import { useContext } from "preact/hooks";
import toposort from "toposort";
import { humanName, sortWith } from "../util";
import { ExportRecipe } from "./schema";
import { AppState } from "./state";
import { Wanifest } from "./wanifest";

const ExtraBlueprintRequirements: [string | string[], ExportRecipe["ingredients"][0]][] = [
  [
    // duviri weapons each require 60 pathos clamp
    [
      "/Lotus/Types/Friendly/PlayerControllable/Weapons/DuviriDualSwordsWeapon",
      "/Lotus/Weapons/Tenno/Melee/Swords/DaxDuviriTwoHandedKatana/DaxDuviriTwoHandedKatanaWeapon",
      "/Lotus/Weapons/Tenno/Melee/Swords/DaxDuviriKatana/DaxDuviriKatanaWeapon",
      "/Lotus/Weapons/Tenno/Melee/Polearms/DaxDuviriPolearm/DaxDuviriPolearmWeapon",
      "/Lotus/Weapons/Tenno/Melee/Hammer/DaxDuviriHammer/DaxDuviriHammerWeapon",
      "/Lotus/Weapons/Tenno/Melee/SwordsAndBoards/DaxDuviriMaceShieldWeapon",
    ],
    {
      ItemType: "/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem",
      ItemCount: 60,
      ProductCategory: "MiscItems",
    },
  ],
  [
    "/Lotus/Weapons/Tenno/LongGuns/TnHopliteSpear/TnHopliteSpearGunWeapon",
    {
      ItemType: "/Lotus/Types/Items/MiscItems/KahlCreds",
      ItemCount: 60,
      ProductCategory: "MiscItems",
    },
  ],
  [
    [
      "/Lotus/Weapons/Grineer/ThrowingWeapons/GrnVorStickyBomb/GrnVorStickyBomb",
      "/Lotus/Weapons/Grineer/Melee/GrnSharbola/GrnSharbolaWeapon",
    ],
    {
      ItemType: "/Lotus/Types/Items/MiscItems/KahlCreds",
      ItemCount: 30,
      ProductCategory: "MiscItems",
    },
  ],
  [
    "/Lotus/Weapons/Tenno/LongGuns/PaxDuviricusShotgun/PaxDuviricusShotgun",
    {
      ItemType: "/Lotus/Types/Gameplay/Duviri/Resource/DuviriKullervoDropItem",
      ItemCount: 30,
      ProductCategory: "MiscItems",
    },
  ],
  [
    [
      "/Lotus/Weapons/Tenno/ThrowingWeapons/TnOraxiaFlechette/TnOraxiaFlechette",
      "/Lotus/Weapons/Tenno/Melee/Whips/SpiderWhip/SpiderWhipWeapon",
      "/Lotus/Weapons/Tenno/Zariman/Melee/HeavyScythe/ZarimanHeavyScythe/ZarimanHeavyScytheWeapon",
    ],
    {
      ItemType: "/Lotus/Types/Gameplay/DuviriMITW/Resources/DuviriMurmurItemB",
      ItemCount: 96,
      ProductCategory: "MiscItems",
    },
  ],
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
      for (const { ItemType } of this.iterIngredients(recipe)) {
        this._edges.push([uniqueName, ItemType]);
        this.add(ItemType, false);
      }
    }
  }

  iterIngredients(recipe: ExportRecipe): ExportRecipe["ingredients"] {
    const regularItems = [...recipe.ingredients];

    for (const [blueprints, dependencies] of ExtraBlueprintRequirements) {
      const matches =
        typeof blueprints === "string" ? blueprints == recipe.resultType : blueprints.includes(recipe.resultType);
      if (matches) regularItems.push(dependencies);
    }

    return regularItems;
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
          for (const { ItemType, ItemCount } of this.iterIngredients(recipe)) {
            addOrInsert(ItemType, (ItemCount * batchSize) / recipe.num);
          }
        }
      } else {
        addOrInsert(key, 1);
        const recipe = this.getRecipe(key);
        if (recipe != null) {
          for (const { ItemType, ItemCount } of this.iterIngredients(recipe)) {
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
