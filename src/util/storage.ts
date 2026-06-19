import { effect, Signal, signal, useSignal, useSignalEffect } from "@preact/signals";
import z from "zod";

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

function storedWith<T>(key: string, fromRaw: (k: string | null) => T, toRaw: (v: T) => string): Signal<T> {
  const underlying = signal<T>(fromRaw(localStorage.getItem(key)));
  effect(() => localStorage.setItem(key, toRaw(underlying.value)));
  return underlying;
}

export function stored<T extends z.ZodType>(key: string, def: T): Signal<z.output<T>> {
  const sch = jsonCodec(def);

  return storedWith(
    key,
    (k) => (k == null ? def.parse(undefined) : sch.decode(k)),
    (v) => sch.encode(v),
  );
}

function useStoredWith<T>(key: string, fromRaw: (k: string | null) => T, toRaw: (v: T) => string): Signal<T> {
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
