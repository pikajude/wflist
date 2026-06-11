import { useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { useLocation } from "preact-iso";
import { useContext } from "preact/hooks";
import IngredientTable from "../components/IngredientTable";
import BrowserContext, { createBrowserContext } from "../components/weapons/BrowserContext";
import BrowserNav from "../components/weapons/BrowserNav";
import WeaponCard from "../components/weapons/WeaponCard";
import { useCraftList } from "../data/craftList";
import { AppState } from "../data/state";
import cx from "../style";
import { useStored } from "../util";

export default function Browse() {
  const vContext = createBrowserContext(useContext(AppState), useLocation());

  const { weapons, options } = vContext;
  const weaponNames = useComputed(() => weapons.value.map((v) => v.uniqueName));
  const useInvasions = useComputed(() => options.value.useInvasions);
  const expanded = useStored("wfBrowserIngredients", false);

  const cd = useCraftList(weaponNames, useInvasions);

  return (
    <BrowserContext value={vContext}>
      <BrowserNav />
      <div className={cx("container", "grid")}>
        <IngredientTable isOpen={expanded} craftData={cd} />
        <For each={weapons}>{(item) => <WeaponCard weapon={item} key={item.uniqueName} />}</For>
      </div>
    </BrowserContext>
  );
}
