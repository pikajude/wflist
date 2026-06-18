import { Signal } from "@preact/signals";
import { createContext } from "preact";
import * as z from "zod";
import { stored } from "../util";
import { Wanifest } from "./wanifest";

export type TState = {
  manifest: Wanifest;

  craftedItems: Signal<z.output<typeof CraftedList>>;
  ingredientsOwned: Signal<z.output<typeof Inventory>>;
};

const CraftedList = z
  .codec(z.array(z.string()), z.set(z.string()), {
    decode: (s) => new Set(s),
    encode: (s) => Array.from(s),
  })
  .prefault([]);
const Inventory = z.record(z.string(), z.number()).prefault({});

export async function createAppState(): Promise<TState> {
  return {
    manifest: await Wanifest.create(),
    craftedItems: stored("wfListCrafted", CraftedList),
    ingredientsOwned: stored("wfListIngredients", Inventory),
  };
}

export const AppState = createContext({} as TState);
