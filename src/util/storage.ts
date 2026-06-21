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

export async function stored<T extends z.ZodType>(key: string, def: T): Promise<Signal<z.output<T>>> {
  const sch = jsonCodec(def);

  const raw = await localforage.getItem<string>(key);

  const init = signal(raw == null ? def.parse(undefined) : sch.decode(raw));

  effect(() => {
    void localforage.setItem(key, sch.encode(init.value)).catch(console.error);
  });

  return init;
}
