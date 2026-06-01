import { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

export type Lazy<T> = { state: "done"; value: T } | { state: "error"; value: Error } | { state: "pending" };

export function completed<T>(value: T): Lazy<T> {
  return { state: "done", value: value };
}

export function pending<T>(): Lazy<T> {
  return { state: "pending" };
}

export function deferred<T>(load: () => Promise<T>): Lazy<T> {
  var [state, setState] = useState<Lazy<T>>({ state: "pending" });

  load().then(
    (value) => setState({ state: "done", value: value }),
    (err) => setState({ state: "error", value: err }),
  );

  return state;
}

export default function Deferred<T>(props: {
  data: () => Promise<T>;
  render: (arg: T) => ComponentChildren;
  fallback?: ComponentChildren;
}) {
  var [state, setState] = useState<Lazy<T>>({ state: "pending" });

  const fallback = props.fallback ?? <div>Loading...</div>;

  useEffect(() => {
    (async () => {
      try {
        setState({ state: "done", value: await props.data() });
      } catch (e) {
        setState({ state: "error", value: e as Error });
      }
    })();
  }, [props.data]);

  if (state.state == "done") return props.render(state.value);
  else if (state.state == "error") return <div>Error: {state.value.message}</div>;
  else return fallback;
}
