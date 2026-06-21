import { effect, Signal, signal } from "@preact/signals";
import localforage from "localforage";
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

export function stored<T extends z.ZodType>(key: string, def: T): Signal<z.output<T>> {
  const sch = jsonCodec(def);

  const fallback = def.parse(undefined);
  const init = signal(fallback);

  void localforage
    .getItem<string>(key)
    .then((v) => {
      if (v != null) init.value = sch.decode(v);
    })
    .catch(console.error);

  effect(() => {
    const val = init.value;
    if (val != fallback) void localforage.setItem(key, sch.encode(val)).catch(console.error);
  });

  return init;
}
