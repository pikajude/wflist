import { useContext } from "preact/hooks";
import { AppState } from "../AppState";

export default function Images() {
  const { manifest } = useContext(AppState);

  return Object.keys(manifest.textures).map((e) => (
    <a key={e} href={manifest.imageUrl(e)}>
      <img src={manifest.imageUrl(e)} width={32} height={32} loading="lazy" />
    </a>
  ));
}
