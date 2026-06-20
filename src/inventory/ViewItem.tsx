import { useComputed } from "@preact/signals";
import { useContext } from "preact/hooks";
import { createInventoryState, InventoryState } from ".";
import { AppState } from "../AppState";
import { useCraftList } from "../crafting";
import IngredientTable from "../crafting/IngredientTable";
import IngredientTree from "../crafting/IngredientTree";
import cx from "../style";
import { useDynamicRoute } from "../util";
import Nav from "./Nav";
import { Categories, categorize } from "./category";

export default function ViewItem() {
  const tapp = useContext(AppState);
  const { manifest } = tapp;

  const { params } = useDynamicRoute();

  const items = useComputed(() => {
    const path = params.value["path"] ?? "";
    const key = manifest.getKey(path.startsWith("Lotus/") ? `/${path}` : path);
    const item =
      manifest.exports["ExportWeapons"].find((w) => w.uniqueName == key) ??
      manifest.exports["ExportWarframes"].find((w) => w.uniqueName == key);
    return item == null ? [] : [item];
  });
  const cat = useComputed(() => {
    for (const it of items.value)
      for (const [k, v] of Object.entries(Categories)) if (v.includes(categorize(it))) return k;

    return "All";
  });

  const istate = createInventoryState(tapp, cat);
  const { options } = istate;
  const img = useComputed(() => options.value.showImages);

  const craftData = useCraftList(
    useComputed(() => items.value.map((i) => i.uniqueName)),
    options,
  );

  return (
    <InventoryState.Provider value={istate}>
      <Nav />
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
    </InventoryState.Provider>
  );
}
