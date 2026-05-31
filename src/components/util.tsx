import { ImgHTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../data";

export function Thumbnail(props: { id: string } & ImgHTMLAttributes) {
  const { manifest } = useContext(AppState);

  const { id, ...rest } = props;

  return <img src={manifest.image_url(id)} {...rest} />;
}

// FIXME: fish bait names are in Gear
export function HumanName(id: string) {
  if (id == "/Lotus/Types/Game/FishBait/Infested/InfestedFishBaitA")
    return "Fass Residue";

  if (id == "/Lotus/Types/Game/FishBait/Infested/OrokinFishBaitA")
    return "Vome Residue";

  const { manifest } = useContext(AppState);

  return manifest.names[id];
}
