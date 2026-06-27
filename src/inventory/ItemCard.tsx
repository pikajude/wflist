import { HTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { AppState } from "../AppState";
import { InventoryState, Item } from "../inventory";
import cx from "../style";
import { slugify, Texture } from "../util";

const enableCopyButton = false;

export default function ItemCard(
  props: {
    item: Item;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { item, ...rest } = props;
  const { craftedItems } = useContext(AppState);
  const { options } = useContext(InventoryState);

  const prettyName = item.name.replace("<ARCHWING>", "[A]");

  const isCrafted = craftedItems.value.has(item.uniqueName);
  const id = slugify(`${item.uniqueName}_crafted`);

  return (
    <div className={cx("card", "g-col-2", "weapon-card", "text-center")} {...rest}>
      <div className={cx("card-body")}>
        {options.value.showImages ? (
          <>
            <a href={`/item${item.uniqueName}`}>
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
        {enableCopyButton && (
          <button
            className={cx("btn", "btn-sm", "btn-primary", "d-block")}
            onClick={() => {
              void window.navigator.clipboard.writeText(
                `${JSON.stringify(prettyName)}: ${JSON.stringify(item.uniqueName)},`,
              );
            }}
          >
            Copy name
          </button>
        )}
        <input
          type="checkbox"
          className={cx("btn-check")}
          id={id}
          autocomplete="off"
          checked={isCrafted}
          onChange={(e) => {
            const copied = new Set(craftedItems.value);
            if (e.currentTarget.checked) copied.add(item.uniqueName);
            else copied.delete(item.uniqueName);
            craftedItems.value = copied;
          }}
        />
        <label className={cx("btn", "btn-sm", "d-block", isCrafted ? "btn-success" : "btn-secondary")} for={id}>
          {isCrafted ? "Crafted" : "Missing"}
        </label>
      </div>
    </div>
  );
}
