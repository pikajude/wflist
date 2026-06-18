import { signal, Signal } from "@preact/signals";
import { createContext } from "preact";
import * as z from "zod";
import { Wanifest } from "./data/wanifest";
import { stored } from "./util";

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

const Inventory = z.codec(z.record(z.string(), z.number()), z.record(z.string(), z.instanceof(Signal<number>)), {
  decode: (raw) => {
    const x: Record<string, Signal<number>> = {};
    for (const key in raw) x[key] = signal(raw[key]);
    return x;
  },
  encode: (dat) => {
    const x: Record<string, number> = {};
    for (const key in dat) x[key] = dat[key].value;
    return x;
  },
});

export async function createAppState(): Promise<TState> {
  return {
    manifest: await Wanifest.create(),
    craftedItems: stored("wfListCrafted", CraftedList),
    ingredientsOwned: stored("wfListIngredients", Inventory),
  };
}

export const AppState = createContext({} as TState);
