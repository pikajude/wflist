import { HTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../data/state";
import cx from "../style";
import { slugify, Texture } from "../util";
import BrowserContext, { ItemEx } from "./BrowserContext";

export default function ItemCard(
  props: {
    item: ItemEx;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { item, ...rest } = props;
  const { craftedItems } = useContext(AppState);
  const { options } = useContext(BrowserContext);

  const prettyName = item.archwing ? `[A] ${item.name}` : item.name;

  const isMastered = craftedItems.value.has(item.uniqueName);
  const id = slugify(`${item.uniqueName}_crafted`);

  return (
    <div className={cx("card", "g-col-2", "weapon-card", "text-center")} {...rest}>
      <div className={cx("card-body")}>
        {options.value.showImages ? (
          <>
            <a href={`/item/${item.name}`}>
              <Texture id={item.uniqueName} className={cx("img-fluid")} />
            </a>
            <div className={cx("card-text")}>{prettyName}</div>
          </>
        ) : (
          <div className={cx("card-text")}>
            <a href={`/item${item.uniqueName}`}>{prettyName}</a>
          </div>
        )}
      </div>
      <div>
        <input
          type="checkbox"
          className={cx("btn-check")}
          id={id}
          autocomplete="off"
          checked={isMastered}
          onChange={(e) =>
            (craftedItems.value = craftedItems.value[e.currentTarget.checked ? "add" : "remove"](item.uniqueName))
          }
        />
        <label className={cx("btn", "btn-sm", "d-block", isMastered ? "btn-success" : "btn-secondary")} for={id}>
          {isMastered ? "Crafted" : "Missing"}
        </label>
      </div>
    </div>
  );
}
