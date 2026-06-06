import { useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { useContext } from "preact/hooks";
import IngredientTable from "../components/IngredientTable";
import { useField } from "../components/util";
import BrowserContext, { createBrowserContext } from "../components/weapons/BrowserContext";
import BrowserNav from "../components/weapons/BrowserNav";
import WeaponCard from "../components/weapons/WeaponCard";
import { AppState } from "../data";
import { useCraftList } from "../data/craftList";
import cx from "../style";

export default function Browse() {
  const vContext = createBrowserContext();

  const { ingredientsOwned } = useContext(AppState);
  const { weapons, options } = vContext;
  const weaponNames = useComputed(() => weapons.value.map((v) => v.uniqueName));
  const useInvasions = useField(options, "useInvasions", false);

  const cd = useCraftList(weaponNames, useInvasions, ingredientsOwned);

  return (
    <BrowserContext value={vContext}>
      <BrowserNav />
      <div className={cx("container", "grid")}>
        <IngredientTable startOpen={true} craftData={cd} maxHeight={300} />
        <For each={weapons}>{(item) => <WeaponCard weapon={item} key={item.uniqueName} />}</For>
      </div>
    </BrowserContext>
  );
}
