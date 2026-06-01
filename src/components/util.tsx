import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { ImgHTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../data";
import { Wanifest } from "../data/wanifest";

export function Thumbnail(props: { id: string } & ImgHTMLAttributes) {
  const { manifest } = useContext(AppState);

  const { id, ...rest } = props;

  return <img src={manifest.image_url(id)} {...rest} />;
}

export function HumanName(id: string) {
  const { manifest } = useContext(AppState);

  return <>{human_name(id, manifest)}</>;
}

export const human_name = (id: string, manifest: Wanifest) => manifest.names[id];

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
