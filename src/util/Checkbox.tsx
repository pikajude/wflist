import { Signal, useSignal } from "@preact/signals";
import { slugify } from ".";
import cx from "../style";

export function Checkbox(props: {
  initialValue: boolean;
  onChange: (b: boolean) => void;
  label: string;
  name?: string;
}) {
  const name = props.name ?? slugify(props.label);
  const isChecked = useSignal(props.initialValue);
  return (
    <div className={cx("form-check")}>
      <input
        type="checkbox"
        id={name}
        className={cx("form-check-input")}
        checked={isChecked.value}
        onChange={(e) => {
          isChecked.value = e.currentTarget.checked;
          props.onChange(e.currentTarget.checked);
        }}
      />
      <label className={cx("form-check-label")} for={name}>
        {props.label}
      </label>
    </div>
  );
}

export const Signalbox = (props: { value: Signal<boolean>; label: string; name?: string }) => (
  <Checkbox
    initialValue={props.value.value}
    onChange={(e) => (props.value.value = e)}
    label={props.label}
    name={props.name}
  />
);
