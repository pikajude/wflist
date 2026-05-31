import { Signal } from "@preact/signals";
import cx from "../style";

export function Checkbox(props: { value: Signal<boolean>; label?: string }) {
  return (
    <label className={cx("mx-2")}>
      <input
        type="checkbox"
        checked={props.value.value}
        onChange={(e) => (props.value.value = e.currentTarget.checked)}
      />{" "}
      {props.label}
    </label>
  );
}
