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

const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString) as z.input<T>;
      } catch (err: unknown) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: (err as Error).message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

export function stored<T extends z.ZodType>(key: string, def: T): Signal<z.output<T>> {
  const sch = jsonCodec(def);

  return storedWith(
    key,
    (k) => (k == null ? def.parse(undefined) : sch.decode(k)),
    (v) => sch.encode(v),
  );
}

export function useStoredWith<T>(key: string, fromRaw: (k: string | null) => T, toRaw: (v: T) => string): Signal<T> {
  const underlying = useSignal<T>(fromRaw(localStorage.getItem(key)));

  useSignalEffect(() => localStorage.setItem(key, toRaw(underlying.value)));

  return underlying;
}

export function useStored<T extends z.ZodType>(key: string, def: T): Signal<z.output<T>> {
  const sch = jsonCodec(def);

  return useStoredWith(
    key,
    (k) => (k == null ? def.parse(undefined) : sch.decode(k)),
    (v) => sch.encode(v),
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
