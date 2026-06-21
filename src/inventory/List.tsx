import { useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { useContext } from "preact/hooks";
import { createInventoryState, InventoryState } from ".";
import { AppState } from "../AppState";
import { useCraftList } from "../crafting";
import IngredientTable from "../crafting/IngredientTable";
import cx from "../style";
import { useDynamicRoute } from "../util";
import ItemCard from "./ItemCard";
import Nav from "./Nav";

export default function ListInventory() {
  const as_ = useContext(AppState);
  const vContext = createInventoryState(as_, useDynamicRoute());

  const { items, options } = vContext;
  const itemNames = useComputed(() => items.value.map((v) => v.uniqueName));

  const cd = useCraftList(itemNames, options);

  return (
    <InventoryState.Provider value={vContext}>
      <Nav />
      <div className={cx("container", "grid")}>
        <IngredientTable isOpen={as_.listOpen} craftData={cd} fixed={true} />
        <For each={items}>{(item) => <ItemCard item={item} key={item.uniqueName} />}</For>
      </div>
      <div className={cx("pt-4", "pb-5")} />
    </InventoryState.Provider>
  );
}
