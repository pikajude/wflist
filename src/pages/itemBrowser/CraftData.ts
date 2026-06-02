import { ReadonlySignal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { useContext } from "preact/hooks";
import { completed, Lazy, pending } from "../../components/Deferred";
import { AppState } from "../../data";
import { CraftList } from "../../data/craftList";

export type CraftData = {
  craftList: ReadonlySignal<Lazy<CraftList>>;
  ingredientsFlat: ReadonlySignal<Lazy<ReturnType<CraftList["flattened"]>>>;
  ownedIngredients: Signal<Record<string, number>>;
};

export function useCraftList(items: ReadonlySignal<string[]>, useInvasions: ReadonlySignal<boolean>): CraftData {
  const { manifest } = useContext(AppState);
  const craftList = useSignal<Lazy<CraftList>>(pending());
  const ingredientsFlat = useSignal<Lazy<ReturnType<CraftList["flattened"]>>>(pending());

  const ownedIngredients = useSignal<Record<string, number>>({});

  useSignalEffect(() => {
    useInvasions.value;
    items.value;
    craftList.value = pending();
    ingredientsFlat.value = pending();
    setTimeout(() => {
      console.log("assembling craft list...");
      craftList.value = completed(new CraftList(manifest, useInvasions.value, items.value));
    });
  });

  useSignalEffect(() => {
    ownedIngredients.value;
    if (craftList.value.state == "done") {
      const ref_ = craftList.value.value;
      setTimeout(() => {
        console.log("calculating flat materials list...");
        ingredientsFlat.value = completed(ref_.flattened(ownedIngredients.value));
      });
    }
  });

  return { craftList, ingredientsFlat, ownedIngredients };
}
