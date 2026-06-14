import { Signal } from "@preact/signals";
import { Set } from "immutable";
import { createContext } from "preact";
import { stored, storedWith } from "../util";
import { Wanifest } from "./wanifest";

export type TState = {
  manifest: Wanifest;

  craftedItems: Signal<Set<string>>;
  ingredientsOwned: Signal<Inventory>;
};

export type Inventory = Record<string, number>;

export async function createAppState(): Promise<TState> {
  const manifest = await Wanifest.create();

  const craftedItems = storedWith<Set<string>>(
    "wfListCrafted",
    (v) => Set(v == null ? [] : (JSON.parse(v) as string[])),
    (m) => JSON.stringify(m.toArray()),
  );

  const ingredientsOwned = stored<Inventory>("wfListIngredients", {});

  return {
    manifest,
    craftedItems,
    ingredientsOwned,
  };
}

export const AppState = createContext({} as TState);
