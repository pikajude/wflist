import { signal } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext } from "preact/hooks";
import { Deferred } from "../components/Deferred";
import IngredientsCard from "../components/Ingredients";
import BrowserNav from "../components/weapons/BrowserNav";
import { AppState } from "../data";
import { ShowCraftList, useCraftList } from "../data/craftList";
import cx from "../style";

export default function ViewItem() {
  const rte = useRoute();
  const { manifest, ingredientsOwned } = useContext(AppState);

  const item = manifest.exports["ExportWeapons"].find((w) => w.uniqueName.slice(1) == rte.params["path"]);

  if (item == null) return <div>Unknown item</div>;

  const craftData = useCraftList(signal([item.uniqueName]), signal(true), ingredientsOwned);

  return (
    <>
      <BrowserNav />
      <div className={cx("container", "grid")}>
        <div className={cx("card", "g-col-12")}>
          <div className={cx("card-body")}>
            <h5 className={cx("card-title")}>Recipe tree</h5>
            <Deferred value={craftData.craftList.value}>{(cl) => <ShowCraftList list={cl.items} />}</Deferred>
          </div>
        </div>
        <IngredientsCard startOpen={true} craftData={craftData} />
      </div>
    </>
  );
}
