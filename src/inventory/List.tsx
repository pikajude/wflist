import { useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { useLocation } from "preact-iso";
import { useContext } from "preact/hooks";
import { boolean } from "zod";
import { createInventoryState, InventoryState } from ".";
import { AppState } from "../AppState";
import { useCraftList } from "../crafting";
import IngredientTable from "../crafting/IngredientTable";
import cx from "../style";
import { useStored } from "../util";
import ItemCard from "./ItemCard";
import Nav from "./Nav";

export default function ListInventory() {
  const vContext = createInventoryState(useContext(AppState), useLocation());

  const { items, options } = vContext;
  const itemNames = useComputed(() => items.value.map((v) => v.uniqueName));
  const expanded = useStored("wfBrowserIngredients", boolean().default(false));

  const cd = useCraftList(itemNames, options);

  return (
    <InventoryState value={vContext}>
      <Nav />
      <div className={cx("container", "grid")}>
        <IngredientTable isOpen={expanded} craftData={cd} fixed={true} />
        <For each={items}>{(item) => <ItemCard item={item} key={item.uniqueName} />}</For>
      </div>
      <div className={cx("pt-4", "pb-5")} />
    </InventoryState>
  );
}
