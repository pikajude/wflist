import { ImgHTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../data";

export function Thumbnail(props: { id: string } & ImgHTMLAttributes) {
  const { manifest } = useContext(AppState);

  const { id, ...rest } = props;

  return <img src={manifest.image_url(id)} {...rest} />;
}

export function HumanName(props: { id: string }) {
  const { manifest } = useContext(AppState);

  const readable = manifest.names[props.id];
  if (readable == null) return `Unknown key: ${props.id}`;

  return readable;
}
