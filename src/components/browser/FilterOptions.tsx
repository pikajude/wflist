import { useSignal } from "@preact/signals";
import { Show } from "@preact/signals/utils";
import { Set } from "immutable";
import { useContext, useState } from "preact/hooks";
import { usePopper } from "react-popper";
import BrowserContext from "../../pages/itemBrowser/BrowserContext";
import cx from "../../style";
import { Checkbox } from "../input";
import { useField } from "../util";

export default function FilterOptions() {
  const { options, masteredWeapons } = useContext(BrowserContext);

  const visible = useSignal(false);

  const [refEl, setRefEl] = useState<HTMLButtonElement | null>(null);
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
    <div className={cx(visible.value ? "dropup" : "dropdown")}>
      <button
        className={cx("btn", "btn-primary", "dropdown-toggle")}
        ref={setRefEl}
        onClick={() => (visible.value = !visible.value)}
      >
        Options
      </button>

      <Show when={visible}>
        <div ref={setPopEl} className={cx("dropdown-menu", "show")} style={styles.popper} {...attributes.popper}>
          <form className={cx("px-3", "py-2")} style={{ width: "400px" }}>
            <Checkbox
              name="useInv"
              value={useField(options, "useInvasions")}
              label="Research components come from invasions"
            />
            <Checkbox name="showIm" value={useField(options, "showImages")} label="Enable images" />
            <Checkbox name="showMa" value={useField(options, "showMastered")} label="Include mastered weapons" />
            <hr />
            <button onClick={() => (masteredWeapons.value = Set())} className={cx("btn", "btn-danger", "btn-sm")}>
              Clear mastery
            </button>
          </form>

          <div ref={setArrowEl} style={styles.arrow} />
        </div>
      </Show>
    </div>
  );
}
