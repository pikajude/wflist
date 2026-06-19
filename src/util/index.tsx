import { useContext } from "preact/hooks";
import { AppState } from "../AppState";
import { PublicExport } from "../publicExport";

export * from "./Checkbox";
export * from "./Deferred";
export * from "./storage";
export * from "./Texture";

export const HumanName = (props: { id: string }) => <>{humanName(props.id, useContext(AppState).manifest)}</>;

export const humanName = (id: string, manifest: PublicExport) =>
  (manifest.names[id] ?? "").replace("<ARCHWING>", "[A]");

export function slugify(input: string): string {
  return input.replace(/\W+/g, "-").toLowerCase();
}

export function sortWith<T, V>(arr: T[], fn: (v: T) => V) {
  return arr
    .map((v) => ({ key: fn(v), value: v }))
    .sort((a, b) => {
      if (a.key < b.key) return -1;
      if (a.key > b.key) return 1;
      return 0;
    })
    .map((a) => a.value);
}
