import { ImgHTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../data";
import { Manifest } from "../data/manifest";

export function Thumbnail(props: { id: string } & ImgHTMLAttributes) {
  const { manifest } = useContext(AppState);

  const { id, ...rest } = props;

  return <img src={manifest.image_url(id)} {...rest} />;
}

// FIXME: fish bait names are in Gear
export function HumanName(id: string) {
  const { manifest } = useContext(AppState);

  return human_name(id, manifest);
}

export function human_name(id: string, manifest: Manifest) {
  if (id == "/Lotus/Types/Game/FishBait/Infested/InfestedFishBaitA")
    return "Fass Residue";

  if (id == "/Lotus/Types/Game/FishBait/Infested/OrokinFishBaitA")
    return "Vome Residue";

  return manifest.names[id];
}
