import { createContext } from "preact";
import { Wanifest } from "./wanifest";

export type TState = {
  manifest: Wanifest;
};

export async function createAppState(): Promise<TState> {
  return {
    manifest: await Wanifest.create(),
  };
}

export const AppState = createContext({} as TState);
