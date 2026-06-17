import { useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { useLocation } from "preact-iso";
import { useContext } from "preact/hooks";
import * as z from "zod";
import BrowserContext, { createBrowserContext } from "../components/BrowserContext";
import BrowserNav from "../components/BrowserNav";
import IngredientTable from "../components/IngredientTable";
import ItemCard from "../components/ItemCard";
import { useCraftList } from "../data/craftList";
import { AppState } from "../data/state";
import cx from "../style";
import { useStored } from "../util";

export default function Browse() {
  const vContext = createBrowserContext(useContext(AppState), useLocation());

  const { items, options } = vContext;
  const itemNames = useComputed(() => items.value.map((v) => v.uniqueName));
  const expanded = useStored("wfBrowserIngredients", z.boolean().default(false));

  const cd = useCraftList(itemNames, options);

  return (
    <BrowserContext value={vContext}>
      <BrowserNav />
      <div className={cx("container", "grid")}>
        <IngredientTable isOpen={expanded} craftData={cd} fixed={true} />
        <For each={items}>{(item) => <ItemCard item={item} key={item.uniqueName} />}</For>
      </div>
      <div className={cx("pt-4", "pb-5")} />
    </BrowserContext>
  );
}
