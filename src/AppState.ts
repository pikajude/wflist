import { signal, Signal } from "@preact/signals";
import { createContext } from "preact";
import z from "zod";
import { PublicExport } from "./publicExport";
import { stored } from "./util";

export type TAppState = {
  manifest: PublicExport;
  craftedItems: Signal<z.output<typeof CraftedList>>;
  ingredientsOwned: Signal<z.output<typeof Inventory>>;
  listOpen: Signal<boolean>;
};

const CraftedList = z
  .codec(z.array(z.string()), z.set(z.string()), {
    decode: (s) => new Set(s),
    encode: (s) => Array.from(s),
  })
  .prefault([]);

const Inventory = z
  .codec(z.record(z.string(), z.number()), z.record(z.string(), z.instanceof(Signal<number>)), {
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
  })
  .prefault({});

export async function createAppState(): Promise<TAppState> {
  return {
    manifest: await PublicExport.create(),
    craftedItems: await stored("wfListCrafted", CraftedList),
    ingredientsOwned: await stored("wfListIngredients", Inventory),
    listOpen: await stored("wfListOpen", z.boolean().default(false)),
  };
}

export const AppState = createContext({} as TAppState);
