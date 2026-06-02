import { ComponentChildren } from "preact";

export type Lazy<T> = { state: "done"; value: T } | { state: "error"; error: Error } | { state: "pending" };

export function completed<T>(value: T): Lazy<T> {
  return { state: "done", value: value };
}

export function pending<T>(): Lazy<T> {
  return { state: "pending" };
}

export function Deferred<T>(props: {
  value: Lazy<T>;
  ok: (arg: T) => ComponentChildren;
  err?: (arg: Error) => ComponentChildren;
  pending?: ComponentChildren;
}) {
  const { value } = props;

  if (value.state == "done") return props.ok(value.value);

  if (value.state == "error") {
    if (props.err != null) return props.err(value.error);

    return <div>Error during render: {`${value.error}`}</div>;
  }

  return props.pending ?? <div>Loading...</div>;
}
