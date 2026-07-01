import { useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { useContext, useMemo } from "preact/hooks";
import { Category, createInventoryState, InventoryState, makeInventoryState, TInventoryState } from ".";
import { AppState } from "../AppState";
import { useCraftList } from "../crafting";
import IngredientTable from "../crafting/IngredientTable";
import cx from "../style";
import { useDynamicRoute } from "../util";
import InventoryStateLoader from "./InventoryStateLoader";
import ItemCard from "./ItemCard";
import Nav from "./Nav";

export default function ListInventory() {
  const a = useContext(AppState);
  const r = useDynamicRoute();

  const loadingState = useMemo<TInventoryState>(
    () => makeInventoryState(Category.safeParse(r.query.value["category"]).data ?? "All"),
    [r.query.value],
  );

  return (
    <InventoryState.Provider value={loadingState}>
      <InventoryStateLoader state={() => createInventoryState(a, r)} pending={<Nav />}>
        <ListInner />
      </InventoryStateLoader>
    </InventoryState.Provider>
  );
}

function ListInner() {
  const { listOpen } = useContext(AppState);
  const { items, options } = useContext(InventoryState);

  const cd = useCraftList(
    useComputed(() => items.value.map((v) => v.uniqueName)),
    options,
  );

  return (
    <>
      <Nav search={true} />
      <div className={cx("container", "grid")}>
        <IngredientTable isOpen={listOpen} craftData={cd} />
        <For each={items}>{(item) => <ItemCard item={item} key={item.uniqueName} />}</For>
      </div>
      <div className={cx("pt-4", "pb-5")} />
    </>
  );
}
