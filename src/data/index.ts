import { Signal } from "@preact/signals";
import { Set } from "immutable";
import { createContext } from "preact";
import { stored, storedWith } from "../util";
import { Wanifest } from "./wanifest";

export type TState = {
  manifest: Wanifest;

  masteredWeapons: Signal<Set<string>>;

  ingredientsOwned: Signal<Record<string, number>>;
};

export async function createAppState(): Promise<TState> {
  const manifest = await Wanifest.create();

  const masteredWeapons = storedWith<Set<string>>(
    "wfListMastered",
    (v) => Set(v == null ? [] : (JSON.parse(v) as string[])),
    (m) => JSON.stringify(m.toArray()),
  );

  const ingredientsOwned = stored<Record<string, number>>("wfListIngredients", {});

  return {
    manifest,
    masteredWeapons,
    ingredientsOwned,
  };
}

export const AppState = createContext({} as TState);
