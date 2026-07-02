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

export type Sortable = string | number | Sortable[];

function cmp(lhs: Sortable, rhs: Sortable): number {
  if (lhs instanceof Array && rhs instanceof Array) {
    for (let i = 0; i < Math.max(lhs.length, rhs.length); i++) {
      if (i >= lhs.length) return -1;
      if (i >= rhs.length) return 1;
      const res = cmp(lhs[i], rhs[i]);
      if (res != 0) return res;
    }
    return 0;
  }

  if (lhs < rhs) return -1;
  if (lhs > rhs) return 1;
  return 0;
}

export function sortWith<T>(arr: T[], fn: (v: T) => Sortable) {
  return arr
    .map((v) => ({ key: fn(v), value: v }))
    .sort((a, b) => cmp(a.key, b.key))
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
