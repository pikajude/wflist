import { useComputed, useSignal } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext } from "preact/hooks";
import { completed } from "../components/Deferred";
import { AppState } from "../data";
import { CraftList, ShowCraftList } from "../data/craftList";
import cx from "../style";
import { IngredientsCard } from "./Weapons";

export function SingleItem() {
  const rte = useRoute();
  const { manifest } = useContext(AppState);

  const item = manifest.exports["ExportWeapons"].find((w) => w.uniqueName.slice(1) == rte.params["path"]);

  if (item == null) return <div>Unknown item</div>;

  const itemsOwned = useSignal({});
  const cl = new CraftList(manifest, true, [item.uniqueName]);
  const ing = useComputed(() => completed(cl.flattened(itemsOwned.value)));

  return (
    <div className={cx("container")}>
      <IngredientsCard ingredients={ing} itemsOwned={itemsOwned} />
      <div className={cx("card")}>
        <div className={cx("card-body")}>
          <h5 className={cx("card-title")}>Recipe tree</h5>
          <ShowCraftList list={cl.items} />
        </div>
      </div>
    </div>
  );
}
