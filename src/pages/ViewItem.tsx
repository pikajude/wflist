import { signal, useComputed } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext } from "preact/hooks";
import BrowserContext from "../components/BrowserContext";
import BrowserNav from "../components/BrowserNav";
import IngredientTable from "../components/IngredientTable";
import IngredientTree from "../components/IngredientTree";
import { useCraftList } from "../data/craftList";
import { AppState } from "../data/state";
import cx from "../style";

export default function ViewItem() {
  const rte = useRoute();
  const { manifest } = useContext(AppState);
  const opts = useContext(BrowserContext);
  const inv = useComputed(() => opts.options.value.useInvasions);
  const img = useComputed(() => opts.options.value.showImages);

  const path = rte.params["path"];

  const key = manifest.getKey(path.startsWith("Lotus/") ? `/${path}` : path);

  const item =
    manifest.exports["ExportWeapons"].find((w) => w.uniqueName == key) ??
    manifest.exports["ExportWarframes"].find((w) => w.uniqueName == key);

  const craftData = useCraftList(signal(item == null ? [] : [item.uniqueName]), inv);

  if (item == null) return <div>Unknown item</div>;

  return (
    <>
      <BrowserNav />
      <div className={cx("container", "grid")}>
        <div className={cx("card", "g-col-10")}>
          <div className={cx("card-body")}>
            <IngredientTree list={craftData.craftList.value} showImages={img.value} />
          </div>
        </div>
        <IngredientTable craftData={craftData} />
        <div className={cx("pt-2")} />
      </div>
    </>
  );
}
