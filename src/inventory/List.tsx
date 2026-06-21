import { signal, useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { useContext, useMemo } from "preact/hooks";
import { createInventoryState, InventoryOptions, InventoryState, SelectedCategory, TInventoryState } from ".";
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
    () => ({
      category: signal((r.query.value["category"] ?? "All") as SelectedCategory),
      items: signal([]),
      options: signal(InventoryOptions.parse(undefined)),
    }),
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
  const as_ = useContext(AppState);
  const vContext = useContext(InventoryState);

  const { items, options } = vContext;
  const itemNames = useComputed(() => items.value.map((v) => v.uniqueName));

  const cd = useCraftList(itemNames, options);

  return (
    <>
      <Nav />
      <div className={cx("container", "grid")}>
        <IngredientTable isOpen={as_.listOpen} craftData={cd} fixed={true} />
        <For each={items}>{(item) => <ItemCard item={item} key={item.uniqueName} />}</For>
      </div>
      <div className={cx("pt-4", "pb-5")} />
    </>
  );
}
