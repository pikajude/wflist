import { signal, useComputed, useSignal } from "@preact/signals";
import { useRoute } from "preact-iso";
import { useContext, useRef } from "preact/hooks";
import { completed } from "../components/Deferred";
import { AppState } from "../data";
import { CraftList, ShowCraftList } from "../data/craftList";
import cx from "../style";
import { CraftData, IngredientsCard } from "./BrowseWeapons";

export function SingleItem() {
  const rte = useRoute();
  const { manifest } = useContext(AppState);

  const item = manifest.exports["ExportWeapons"].find((w) => w.uniqueName.slice(1) == rte.params["path"]);

  if (item == null) return <div>Unknown item</div>;

  const itemsOwned = useSignal({});
  const cl = useRef(new CraftList(manifest, true, [item.uniqueName]));

  const cd: CraftData = {
    craftList: signal(completed(cl.current)),
    ingredientsFlat: useComputed(() => completed(cl.current.flattened(itemsOwned.value))),
    ownedIngredients: itemsOwned,
  };

  return (
    <div className={cx("container")}>
      <IngredientsCard craftData={cd} />
      <div className={cx("card")}>
        <div className={cx("card-body")}>
          <h5 className={cx("card-title")}>Recipe tree</h5>
          <ShowCraftList list={cl.current.items} />
        </div>
      </div>
    </div>
  );
}
