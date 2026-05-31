import { createContext } from "preact";
import { Manifest } from "./manifest";

export type TState = {
  manifest: Manifest;
};

export async function createAppState(): Promise<TState> {
  return {
    manifest: await Manifest.create(),
  };
}

export const AppState = createContext({} as TState);
