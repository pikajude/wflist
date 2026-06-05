import { Signal } from "@preact/signals";
import cx from "../style";
import { slugify } from "./util";

export function Checkbox(props: { value: Signal<boolean>; label: string; name?: string }) {
  const name = props.name ?? slugify(props.label);
  return (
    <div className={cx("form-check", "mb-2")}>
      <input
        type="checkbox"
        id={name}
        className={cx("form-check-input")}
        checked={props.value}
        onChange={(e) => (props.value.value = e.currentTarget.checked)}
      />
      <label className={cx("form-check-label")} for={name}>
        {props.label}
      </label>
    </div>
  );
}
