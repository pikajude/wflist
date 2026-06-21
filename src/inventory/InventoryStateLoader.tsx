import { ComponentChildren } from "preact";
import { InventoryState, TInventoryState } from ".";
import { Deferred, useLazy } from "../util";

export default function InventoryStateLoader(props: {
  state: () => Promise<TInventoryState>;
  children: ComponentChildren;
}) {
  return (
    <Deferred value={useLazy(props.state)}>
      {(istate) => <InventoryState.Provider value={istate}>{props.children}</InventoryState.Provider>}
    </Deferred>
  );
}
