import { ImgHTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../AppState";

export function Texture(props: { id: string } & ImgHTMLAttributes) {
  const { manifest } = useContext(AppState);

  if (typeof manifest === "undefined") return <></>;

  const { id, ...rest } = props;

  return <img src={manifest.imageUrl(id)} {...rest} />;
}
