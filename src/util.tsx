import { effect, signal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { ImgHTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import * as z from "zod";
import { AppState } from "./data/state";
import { Wanifest } from "./data/wanifest";

export function Texture(props: { id: string } & ImgHTMLAttributes) {
  const { manifest } = useContext(AppState);

  if (typeof manifest === "undefined") return <></>;

  const { id, ...rest } = props;

  return <img src={manifest.imageUrl(id)} {...rest} />;
}

export const HumanName = (id: string) => <>{humanName(id, useContext(AppState).manifest)}</>;

export const humanName = (id: string, manifest: Wanifest) => (manifest.names[id] ?? "").replace("<ARCHWING>", "[A]");

export function storedWith<T>(key: string, fromRaw: (k: string | null) => T, toRaw: (v: T) => string): Signal<T> {
  const underlying = signal<T>(fromRaw(localStorage.getItem(key)));
  effect(() => localStorage.setItem(key, toRaw(underlying.value)));
  return underlying;
}

export function stored<T extends z.ZodType>(key: string, def: T): Signal<z.output<T>> {
  return storedWith(
    key,
    (k) => {
      const res = def.safeParse(k == null ? def : JSON.parse(k));
      if (res.success) return res.data;
      console.warn(`Unable to load ${key}: ${res.error}`);
      return def.parse(undefined);
    },
    (v) => JSON.stringify(v),
  );
}

export function useStoredWith<T>(key: string, fromRaw: (k: string | null) => T, toRaw: (v: T) => string): Signal<T> {
  const underlying = useSignal<T>(fromRaw(localStorage.getItem(key)));

  useSignalEffect(() => localStorage.setItem(key, toRaw(underlying.value)));

  return underlying;
}

export function useStored<T extends z.ZodType>(key: string, def: T): Signal<z.output<T>> {
  return useStoredWith(
    key,
    (k) => {
      const res = def.safeParse(k == null ? def : JSON.parse(k));
      if (res.success) return res.data;
      console.warn(`Unable to load ${key}: ${res.error}`);
      return def.parse(undefined);
    },
    (v) => JSON.stringify(v),
  );
}

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
