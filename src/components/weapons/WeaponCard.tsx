import { HTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../../data/state";
import cx from "../../style";
import { Texture } from "../../util";
import { Checkbox } from "../input";
import BrowserContext, { ItemEx } from "./BrowserContext";

export default function WeaponCard(
  props: {
    weapon: ItemEx;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { weapon, ...rest } = props;
  const { craftedItems: masteredWeapons } = useContext(AppState);
  const { options } = useContext(BrowserContext);

  const prettyName = weapon.archwing ? `[A] ${weapon.name}` : weapon.name;

  return (
    <div className={cx("card", "g-col-2")} {...rest}>
      <div className={cx("card-body", "weapon-card")}>
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
      </div>
      <ul className={cx("list-group", "list-group-flush")}>
        <li className={cx("list-group-item")}>
          <form>
            <Checkbox
              initialValue={masteredWeapons.value.has(weapon.uniqueName)}
              onChange={(e) => (masteredWeapons.value = masteredWeapons.value[e ? "add" : "remove"](weapon.uniqueName))}
              name={`${weapon.uniqueName}_ma`}
              label="Crafted"
            />
          </form>
        </li>
      </ul>
    </div>
  );
}
