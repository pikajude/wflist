import { useComputed, useSignal } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext, useEffect } from "preact/hooks";
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
  const img = useComputed(() => opts.options.value.showImages);

  const items = useSignal<string[]>([]);

  // TODO: why can't we just usesignal here?
  useEffect(() => {
    const path = rte.params["path"];
    const key = manifest.getKey(path.startsWith("Lotus/") ? `/${path}` : path);
    const item =
      manifest.exports["ExportWeapons"].find((w) => w.uniqueName == key) ??
      manifest.exports["ExportWarframes"].find((w) => w.uniqueName == key);
    items.value = item == null ? [] : [item.uniqueName];
  }, [items, manifest, rte.params]);

  const craftData = useCraftList(items, opts.options);

  return (
    <>
      <BrowserNav />
      <div className={cx("container", "grid")}>
        {items.value.length == 0 ? (
          <div className={cx("card", "g-col-10")}>
            <div className={cx("card-body")}>Unknown item.</div>
          </div>
        ) : (
          <>
            <div className={cx("card", "g-col-10")}>
              <div className={cx("card-body")}>
                <IngredientTree list={craftData.craftList.value} showImages={img.value} />
              </div>
            </div>
            <IngredientTable craftData={craftData} />
            <div className={cx("pt-2")} />
          </>
        )}
      </div>
    </>
  );
}
