import { signal } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext } from "preact/hooks";
import IngredientsCard from "../components/crafting/Ingredients";
import { Deferred } from "../components/Deferred";
import { AppState } from "../data";
import { ShowCraftList } from "../data/craftList";
import cx from "../style";
import { useCraftList } from "./itemBrowser/CraftData";

export default function ViewItem() {
  const rte = useRoute();
  const { manifest } = useContext(AppState);

  const item = manifest.exports["ExportWeapons"].find((w) => w.uniqueName.slice(1) == rte.params["path"]);

  if (item == null) return <div>Unknown item</div>;

  const craftData = useCraftList(signal([item.uniqueName]), signal(true));

  return (
    <div className={cx("container")}>
      <IngredientsCard craftData={craftData} />
      <div className={cx("card")}>
        <div className={cx("card-body")}>
          <h5 className={cx("card-title")}>Recipe tree</h5>
          <Deferred value={craftData.craftList.value} ok={(cl) => <ShowCraftList list={cl.items} />} />
        </div>
      </div>
    </div>
  );
}
