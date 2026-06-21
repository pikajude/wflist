import { Signal, useSignal } from "@preact/signals";
import equal from "fast-deep-equal";
import { RouteHook, useRoute } from "preact-iso";
import { useContext, useEffect, useState } from "preact/hooks";
import { AppState } from "../AppState";
import { PublicExport } from "../publicExport";
import { completed, Lazy, pending } from "./Deferred";

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

export type RouteSignal = {
  path: Signal<string>;
  query: Signal<RouteHook["query"]>;
  params: Signal<RouteHook["params"]>;
};

export function useDynamicRoute() {
  const r = useRoute();

  const path = useSignal(r.path);
  const query = useSignal(r.query);
  const params = useSignal(r.params);

  useEffect(() => {
    path.value = r.path;
  }, [path, r.path]);
  useEffect(() => {
    if (!equal(r.query, query.value)) query.value = { ...r.query };
  }, [r.query, query]);
  useEffect(() => {
    if (!equal(r.params, params.value)) params.value = { ...r.params };
  }, [r.params, params]);

  return { path, query, params };
}

export function useLazy<T>(p: () => Promise<T>): Lazy<T> {
  const [val, setVal] = useState(pending<T>());

  useEffect(() => {
    p()
      .then((res) => setVal(completed(res)))
      .catch(console.error);
  }, [p, setVal]);

  return val;
}
