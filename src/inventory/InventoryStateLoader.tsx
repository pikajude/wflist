import { ComponentChildren } from "preact";
import { InventoryState, TInventoryState } from ".";
import { Deferred, useLazy } from "../util";

export default function InventoryStateLoader(props: {
  state: () => Promise<TInventoryState>;
  pending?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <Deferred value={useLazy(props.state)} pending={props.pending}>
      {(istate) => <InventoryState.Provider value={istate}>{props.children}</InventoryState.Provider>}
    </Deferred>
  );
}
