import { HTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../../data/state";
import cx from "../../style";
import { Texture } from "../../util";
import { Checkbox } from "../input";
import BrowserContext, { WeaponEx } from "./BrowserContext";

export default function WeaponCard(
  props: {
    weapon: WeaponEx;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { weapon, ...rest } = props;
  const { masteredWeapons } = useContext(AppState);
  const { options } = useContext(BrowserContext);

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
            initialValue={masteredWeapons.value.has(weapon.uniqueName)}
            onChange={(e) => (masteredWeapons.value = masteredWeapons.value[e ? "add" : "remove"](weapon.uniqueName))}
            name={`${weapon.uniqueName}_ma`}
            label="Crafted"
          />
        </form>
      </div>
    </div>
  );
}
