import { useSignal } from "@preact/signals";
import { Show } from "@preact/signals/utils";
import { Set } from "immutable";
import { useContext, useState } from "preact/hooks";
import { usePopper } from "react-popper";
import { AppState } from "../data/state";
import cx from "../style";
import BrowserContext from "./BrowserContext";
import { Checkbox } from "./input";

export default function FilterOptions() {
  const { craftedItems: masteredWeapons, ingredientsOwned } = useContext(AppState);
  const { options } = useContext(BrowserContext);

  const visible = useSignal(false);

  const [refEl, setRefEl] = useState<HTMLAnchorElement | null>(null);
  const [popEl, setPopEl] = useState<HTMLDivElement | null>(null);
  const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(refEl, popEl, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "arrow",
        options: { element: arrowEl },
      },
    ],
  });

  return (
    <div className={cx("nav-item", visible.value ? "dropup" : "dropdown")} style={{ marginLeft: "auto" }}>
      <a
        className={cx("nav-link", "dropdown-toggle")}
        ref={setRefEl}
        role="button"
        onClick={() => (visible.value = !visible.value)}
      >
        Options
      </a>

      <Show when={visible}>
        <div ref={setPopEl} className={cx("dropdown-menu", "show")} style={styles.popper} {...attributes.popper}>
          <form className={cx("px-3", "py-2")} style={{ width: "400px" }}>
            <Checkbox
              initialValue={options.value.useInvasions}
              onChange={(e) => (options.value = { ...options.value, useInvasions: e })}
              label="Research components come from invasions"
            />
            <Checkbox
              initialValue={options.value.showImages}
              onChange={(e) => (options.value = { ...options.value, showImages: e })}
              label="Show images"
            />
            <Checkbox
              initialValue={options.value.hideCrafted}
              onChange={(e) => (options.value = { ...options.value, hideCrafted: e })}
              label="Hide already crafted items"
            />
            <Checkbox
              initialValue={options.value.hideVaulted}
              onChange={(e) => (options.value = { ...options.value, hideVaulted: e })}
              label="Hide vaulted items"
            />
            <hr />
            <div className={cx("mb-2")}>
              <button
                className={cx("btn", "btn-primary", "btn-sm")}
                onClick={(evt) => {
                  evt.preventDefault();
                  void window.navigator.clipboard.writeText(JSON.stringify(ingredientsOwned.value, null, 2));
                }}
              >
                Export inventory (to clipboard)
              </button>
            </div>
            <div>
              <button
                onClick={(evt) => {
                  evt.preventDefault();
                  if (confirm("Are you sure you want to reset your crafted items?")) masteredWeapons.value = Set();
                }}
                className={cx("btn", "btn-danger", "btn-sm")}
              >
                Forget crafted items
              </button>
            </div>
          </form>

          <div ref={setArrowEl} style={styles.arrow} />
        </div>
      </Show>
    </div>
  );
}
