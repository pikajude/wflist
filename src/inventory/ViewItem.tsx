import { useComputed, useSignal } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext, useEffect } from "preact/hooks";
import { InventoryState } from ".";
import { AppState } from "../AppState";
import { useCraftList } from "../crafting";
import IngredientTable from "../crafting/IngredientTable";
import IngredientTree from "../crafting/IngredientTree";
import cx from "../style";
import Nav from "./Nav";

export default function ViewItem() {
  const rte = useRoute();
  const { manifest } = useContext(AppState);
  const opts = useContext(InventoryState);
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
      <Nav />
      <div className={cx("container", "grid")}>
        <h1 className={cx("g-col-10", "fs-5")}>{items.value[0]}</h1>
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
