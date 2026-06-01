import { ReadonlySignal, Signal } from "@preact/signals";
import { Set } from "immutable";
import cx from "../style";

export function Checkbox(props: { value: Signal<boolean>; name: string; label?: string }) {
  return <CheckboxF onChange={(v) => (props.value.value = v)} {...props} />;
}

export function CheckboxF(props: {
  value: ReadonlySignal<boolean>;
  onChange: (arg: boolean) => void;
  name: string;
  label?: string;
}) {
  return (
    <div className={cx("form-check", "mb-2")}>
      <input
        type="checkbox"
        id={props.name}
        className={cx("form-check-input")}
        checked={props.value.value}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <label className={cx("form-check-label")} for={props.name}>
        {props.label}
      </label>
    </div>
  );
}

export function toggle<T>(signal: Signal<Set<T>>, value: T) {
  signal.value = signal.value.withMutations((s) => {
    if (s.has(value)) s.remove(value);
    else s.add(value);
  });
}
