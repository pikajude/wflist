import { effect, signal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { ImgHTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../data";
import { Wanifest } from "../data/wanifest";

export function Texture(props: { id: string } & ImgHTMLAttributes) {
  const { manifest } = useContext(AppState);

  const { id, ...rest } = props;

  return <img src={manifest.image_url(id)} {...rest} />;
}

export function HumanName(id: string) {
  const { manifest } = useContext(AppState);

  return <>{humanName(id, manifest)}</>;
}

export const humanName = (id: string, manifest: Wanifest) => manifest.names[id];

export function storedWith<T>(key: string, fromRaw: (k: string | null) => T, toRaw: (v: T) => string): Signal<T> {
  const underlying = signal<T>(fromRaw(localStorage.getItem(key)));
  effect(() => localStorage.setItem(key, toRaw(underlying.value)));
  return underlying;
}

export function stored<T>(key: string, def: T): Signal<T> {
  return storedWith(
    key,
    (k) => (k == null ? def : JSON.parse(k)),
    (v) => JSON.stringify(v),
  );
}

export function useStoredWith<T>(key: string, fromRaw: (k: string | null) => T, toRaw: (v: T) => string): Signal<T> {
  const underlying = useSignal<T>(fromRaw(localStorage.getItem(key)));

  useSignalEffect(() => localStorage.setItem(key, toRaw(underlying.value)));

  return underlying;
}

export function useStored<T>(key: string, def: T): Signal<T> {
  return useStoredWith(
    key,
    (k) => (k == null ? def : JSON.parse(k)),
    (v) => JSON.stringify(v),
  );
}

export function slugify(input: string): string {
  return input.replace(/\W+/g, "-").toLowerCase();
}

export function useField<T extends {}, N extends keyof T>(
  input: Signal<T>,
  field: N,
  defaultValue: T[N],
): Signal<T[N]> {
  return useMapped<T, T[N]>(
    input,
    (v) => v[field] ?? defaultValue,
    (s, v) => ({ ...s, [field]: v }),
  );
}

export function useMapped<T, V>(input: Signal<T>, get: (arg: T) => V, set: (arg: T, value: V) => T) {
  const copied = useSignal(get(input.peek()));

  useSignalEffect(() => {
    const val = set(input.peek(), copied.value);
    console.log("updating signal...");
    input.value = val;
  });

  return copied;
}
