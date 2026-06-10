import { signal, useComputed } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext } from "preact/hooks";
import { AppState } from "..";
import { Deferred } from "../components/Deferred";
import IngredientTable from "../components/IngredientTable";
import IngredientTree from "../components/IngredientTree";
import BrowserContext from "../components/weapons/BrowserContext";
import BrowserNav from "../components/weapons/BrowserNav";
import { useCraftList } from "../data/craftList";
import cx from "../style";

export default function ViewItem() {
  const rte = useRoute();
  const { manifest } = useContext(AppState);
  const opts = useContext(BrowserContext);
  const inv = useComputed(() => opts.options.value.useInvasions);
  const img = useComputed(() => opts.options.value.showImages);

  const item = manifest.exports["ExportWeapons"].find((w) => w.uniqueName.slice(1) == rte.params["path"]);

  const craftData = useCraftList(signal(item == null ? [] : [item.uniqueName]), inv);

  if (item == null) return <div>Unknown item</div>;

  return (
    <>
      <BrowserNav />
      <div className={cx("container", "grid")}>
        <div className={cx("card", "g-col-12")}>
          <div className={cx("card-body")}>
            <Deferred value={craftData.craftList.value}>
              {(cl) => <IngredientTree list={cl} showImages={img.value} />}
            </Deferred>
          </div>
        </div>
        <IngredientTable startOpen={true} craftData={craftData} />
      </div>
    </>
  );
}
