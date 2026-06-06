import { useComputed } from "@preact/signals";
import { For } from "@preact/signals/utils";
import { HTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import IngredientsCard from "../../components/Ingredients";
import { Checkbox } from "../../components/input";
import { Texture, useMapped } from "../../components/util";
import cx from "../../style";
import BrowserContext, { BrowserWeapon, createBrowserContext } from "./BrowserContext";
import { useCraftList } from "./CraftData";
import FilterOptions from "./FilterOptions";
import Tab from "./Tab";

export default function Browse() {
  const vContext = createBrowserContext();

  const { weapons, options } = vContext;
  const weaponNames = useComputed(() => weapons.value.map((v) => v.uniqueName));
  const useInvasions = useComputed(() => options.value.useInvasions);

  const cd = useCraftList(weaponNames, useInvasions);

  return (
    <BrowserContext value={vContext}>
      <nav className={cx("navbar", "navbar-expand-lg", "sticky-top", "bg-body-tertiary", "nav", "nav-pills")}>
        <div className={cx("container-fluid")}>
          <Tab label="All" />
          <Tab label="Primary" />
          <Tab label="Secondary" />
          <Tab label="Melee" />
          <FilterOptions />
        </div>
      </nav>
      <div className={cx("container", "mt-4", "grid")}>
        <IngredientsCard startOpen={true} craftData={cd} maxHeight={300} />
        <For each={weapons}>{(item) => <WeaponCard weapon={item} key={item.uniqueName} />}</For>
      </div>
    </BrowserContext>
  );
}

function WeaponCard(
  props: {
    weapon: BrowserWeapon;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { weapon, ...rest } = props;
  const { options, masteredWeapons } = useContext(BrowserContext);

  const prettyName = weapon.archwing ? `[A] ${weapon.name}` : weapon.name;

  return (
    <div
      className={cx("card", {
        "g-col-3": options.value.showImages,
        "g-col-2": !options.value.showImages,
      })}
      {...rest}
    >
      <div className={cx("card-body")}>
        {options.value.showImages ? (
          <>
            <a href={`/item${weapon.uniqueName}`}>
              <Texture id={weapon.uniqueName} className={cx("img-fluid")} />
            </a>
            <div className={cx("card-text")}>{prettyName}</div>
          </>
        ) : (
          <div className={cx("card-text")}>
            <a href={`/item${weapon.uniqueName}`}>{prettyName}</a>
          </div>
        )}
        <form>
          <Checkbox
            value={useMapped(
              masteredWeapons,
              (w) => w.has(weapon.uniqueName),
              (m, v) => m[v ? "add" : "remove"](weapon.uniqueName),
            )}
            name={`${weapon.uniqueName}_ma`}
            label="Mastered"
          />
        </form>
      </div>
    </div>
  );
}
