import { useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { Show } from "@preact/signals/utils";
import { useCallback, useContext } from "preact/hooks";
import { InventoryState } from ".";
import { AppState } from "../AppState";
import { Brace, Grip, Jet, Link, Loader, Nose, Reactor, Scaffold, ZawGrip } from "../crafting/modular";
import cx from "../style";
import { Checkbox } from "../util";

export default function ListFilters() {
  const animating = useSignal(false);
  const visible = useSignal(false);
  const inDom = useComputed(() => animating.value || visible.value);

  const toggle = useCallback(() => {
    const next = !visible.value;
    animating.value = true;
    setTimeout(() => {
      visible.value = next;
      if (next) animating.value = false;
      else setTimeout(() => (animating.value = false), 150);
    });
  }, [visible, animating]);

  useSignalEffect(() => {
    const vis = visible.value;
    if (vis) document.body.style = "overflow: hidden";
    else document.body.style = "";
  });

  return (
    <div className={cx("nav-item")} style={{ marginLeft: "auto" }}>
      <a className={cx("nav-link")} role="button" onClick={toggle}>
        <i className={cx("fa-solid", "fa-gear")} /> Options
      </a>

      <Show when={inDom}>
        <div className={cx("modal-backdrop", "fade", { show: visible.value })} />

        <div className={cx("modal", "fade", { show: visible.value })} style={{ display: "block" }} onMouseDown={toggle}>
          <div className={cx("modal-dialog", "modal-xl")} onMouseDown={(e) => e.stopPropagation()}>
            <div className={cx("modal-content")}>
              <div className={cx("modal-header")}>
                <h1 className={cx("modal-title", "fs-5")}>List settings</h1>
                <button className={cx("btn-close")} type="button" onClick={toggle} />
              </div>
              <OptionsForm />
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

function OptionsForm() {
  const { manifest, craftedItems, ingredientsOwned } = useContext(AppState);
  const { options } = useContext(InventoryState);

  return (
    <form className={cx("px-3", "py-3")}>
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
      <div className={cx("mb-3")}>
        <label className={cx("form-label")}>Amp components</label>
        <div className={cx("input-group", "input-group-sm")}>
          <Selector
            options={Brace}
            selected={options.value.modular.ampBrace}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, ampBrace: x } };
            }}
          />
          <Selector
            options={Scaffold}
            selected={options.value.modular.ampScaffold}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, ampScaffold: x } };
            }}
          />
        </div>
      </div>
      <div className={cx("mb-3")}>
        <label className={cx("form-label")}>K-Drive components</label>
        <div className={cx("input-group", "input-group-sm")}>
          <Selector
            options={Nose}
            selected={options.value.modular.boardNose}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, boardNose: x } };
            }}
          />
          <Selector
            options={Jet}
            selected={options.value.modular.boardJet}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, boardJet: x } };
            }}
          />
          <Selector
            options={Reactor}
            selected={options.value.modular.boardReactor}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, boardReactor: x } };
            }}
          />
        </div>
      </div>
      <div className={cx("mb-3")}>
        <label className={cx("form-label")}>Kitgun components</label>
        <div className={cx("input-group", "input-group-sm")}>
          <Selector
            options={Grip}
            selected={options.value.modular.gunGrip}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, gunGrip: x } };
            }}
          />
          <Selector
            options={Loader}
            selected={options.value.modular.gunLoader}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, gunLoader: x } };
            }}
          />
        </div>
      </div>
      <div className={cx("mb-3")}>
        <label className={cx("form-label")}>Zaw components</label>
        <div className={cx("input-group", "input-group-sm")}>
          <Selector
            options={ZawGrip}
            selected={options.value.modular.zawGrip}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, zawGrip: x } };
            }}
          />
          <Selector
            options={Link}
            selected={options.value.modular.zawLink}
            onChange={(x) => {
              options.value = { ...options.value, modular: { ...options.value.modular, zawLink: x } };
            }}
          />
        </div>
      </div>
      <hr />
      <div className={cx("mb-2", "input-group")}>
        <button
          className={cx("btn", "btn-sm", "btn-outline-light")}
          onClick={(evt) => {
            evt.preventDefault();
            void window.navigator.clipboard.writeText(JSON.stringify(ingredientsOwned.value, null, 2));
          }}
        >
          Copy inventory to clipboard
        </button>
        <button
          className={cx("btn", "btn-sm", "btn-outline-light")}
          onClick={(evt) => {
            evt.preventDefault();
            void window.navigator.clipboard.writeText(JSON.stringify(options.value, null, 2));
          }}
        >
          Copy settings to clipboard
        </button>
        <button
          className={cx("btn", "btn-sm", "btn-outline-light")}
          onClick={() => {
            const dlink = document.createElement("a");
            dlink.href = window.URL.createObjectURL(
              new Blob([JSON.stringify(manifest.exports)], { type: "application/json" }),
            );
            dlink.download = "export-full.json";
            dlink.target = "_blank";
            document.body.appendChild(dlink);
            dlink.click();
          }}
        >
          Download public Warframe export
        </button>
      </div>
      <div>
        <button
          onClick={(evt) => {
            evt.preventDefault();
            if (confirm("Are you sure you want to reset your crafted items?")) craftedItems.value = new Set();
          }}
          className={cx("btn", "btn-danger", "btn-sm")}
        >
          Forget crafted items
        </button>
      </div>
    </form>
  );
}

function Selector(props: { options: { [key: string]: string }; selected: string; onChange: (v: string) => void }) {
  const entries = Object.entries(props.options);

  return (
    <select
      className={cx("form-select", "form-select-sm", "form-control")}
      id="kgL"
      onChange={(v) => props.onChange((entries[v.currentTarget.selectedIndex - 1] ?? ["", ""])[1])}
    >
      <option selected={props.selected == ""}>None</option>
      {entries.map(([name, key]) => (
        <option selected={key == props.selected} key={key}>
          {name}
        </option>
      ))}
    </select>
  );
}
