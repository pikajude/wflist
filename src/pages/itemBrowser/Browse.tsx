import { useComputed } from "@preact/signals";
import { HTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import FilterOptions from "../../components/browser/FilterOptions";
import Tab from "../../components/browser/Tab";
import IngredientsCard from "../../components/crafting/Ingredients";
import { CheckboxF, toggle } from "../../components/input";
import { Texture } from "../../components/util";
import { ExportWeapon } from "../../data/schema";
import cx from "../../style";
import BrowserContext, { createBrowserContext } from "./BrowserContext";
import { useCraftList } from "./CraftData";

export default function Browse() {
  const vContext = createBrowserContext();

  const { weapons } = vContext;
  const weaponNames = useComputed(() => weapons.value.map((v) => v.uniqueName));

  const cd = useCraftList(weaponNames, vContext.options.useInvasions);

  return (
    <BrowserContext value={vContext}>
      <nav className={cx("navbar")}>
        <ul className={cx("nav", "nav-underline", "mb-2")}>
          <Tab label="Primary" />
          <Tab label="Secondary" />
          <Tab label="Melee" />
          <Tab label="All" />
        </ul>
        <FilterOptions />
      </nav>
      <div className={cx("container")}>
        <div className={cx("grid")}>
          <IngredientsCard craftData={cd} style={{ height: "320px" }} />
          {weapons.value.map((c, i) => (
            <WeaponCard weapon={c} key={c.uniqueName} />
          ))}
        </div>
      </div>
    </BrowserContext>
  );
}

function WeaponCard(
  props: {
    weapon: ExportWeapon;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { weapon, ...rest } = props;
  const {
    options: { showImages: showImage, masteredWeapons },
  } = useContext(BrowserContext);

  const isChecked = useComputed(() => masteredWeapons.value.has(weapon.uniqueName));

  return (
    <div
      className={cx("card", {
        "g-col-3": showImage.value,
        "g-col-2": !showImage.value,
      })}
      {...rest}
    >
      <div className={cx("card-body")}>
        {showImage.value ? (
          <>
            <a href={`/item${weapon.uniqueName}`}>
              <Texture id={weapon.uniqueName} className={cx("img-fluid")} />
            </a>
            <div className={cx("card-text")}>{weapon.name}</div>
          </>
        ) : (
          <div className={cx("card-text")}>
            <a href={`/item${weapon.uniqueName}`}>{weapon.name}</a>
          </div>
        )}
        <form>
          <CheckboxF
            value={isChecked}
            onChange={(_) => toggle(masteredWeapons, weapon.uniqueName)}
            name={`${weapon.uniqueName}_ma`}
            label="Mastered"
          />
        </form>
      </div>
    </div>
  );
}
