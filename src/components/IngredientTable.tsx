import { signal, Signal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { useContext } from "preact/hooks";
import { CraftData, CraftRequirement } from "../data/craftList";
import { AppState } from "../data/state";
import cx from "../style";
import { HumanName, Texture } from "../util";
import { Signalbox } from "./input";

export default function IngredientTable(props: { craftData: CraftData; isOpen?: Signal<boolean>; fixed?: boolean }) {
  let {
    craftData: { ingredientsFlat: ingredients },
    isOpen,
    fixed,
  } = props;
  fixed ??= false;
  const { ingredientsOwned } = useContext(AppState);
  const onlyMissing = useSignal(true);
  isOpen ??= signal(true);

  const lastIngredients = useComputed(() => {
    const filt = onlyMissing.value;
    return ingredients.value.filter((v) => !v[1].toplevel && (!filt || v[1].quantityNeeded > 0));
  });

  return (
    <div
      className={cx("accordion", "ingredients-table", {
        show: isOpen.value,
        "fixed-bottom": fixed,
        "accordion-flush": fixed,
        "g-col-10": !fixed,
      })}
    >
      <div className={cx("accordion-item")}>
        <h2 className={cx("accordion-header")}>
          <button
            className={cx("accordion-button", {
              collapsed: isOpen.value,
              "border-top": fixed,
              "border-bottom": fixed,
              "shadow-none": fixed,
            })}
            onClick={() => (isOpen.value = !isOpen.value)}
          >
            Ingredients ({lastIngredients.value.length})
          </button>
        </h2>
        <div className={cx("accordion-collapse", "collapse", { show: isOpen.value, "pt-5": isOpen.value })}>
          <div className={cx("accordion-body")}>
            <div className={cx("d-flex", "justify-content-between")}>
              <Signalbox value={onlyMissing} label="Only show missing items" />
              <button
                className={cx("btn", "btn-sm", "btn-danger")}
                onClick={() => {
                  if (confirm("This operation cannot be undone!")) ingredientsOwned.value = {};
                }}
              >
                Clear inventory
              </button>
            </div>
            <table className={cx("table", "table-striped", "table-sm", "align-middle")}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Total</th>
                  <th>Missing</th>
                  <th>Owned</th>
                </tr>
              </thead>
              <tbody>
                {lastIngredients.value.map(([uniqueName, req]) => (
                  <IngredientRow uniqueName={uniqueName} requirement={req} key={uniqueName} />
                ))}
                {lastIngredients.value.length == 0 && (
                  <tr>
                    <td colspan={4}>List complete!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IngredientRow({ uniqueName, requirement }: { uniqueName: string; requirement: CraftRequirement }) {
  const faded = requirement.quantityNeeded == 0;
  const fadedClass = cx({ "text-secondary": faded, "text-decoration-line-through": faded });

  const { ingredientsOwned } = useContext(AppState);

  const quantity = useSignal(ingredientsOwned.value[uniqueName] ?? 0);

  useSignalEffect(() => {
    const q = quantity.value;
    const ing = ingredientsOwned.peek();
    if (ing[uniqueName] != q) ingredientsOwned.value = { ...ing, [uniqueName]: q };
  });

  return (
    <tr>
      <td>
        <Texture id={uniqueName} width="24px" /> <span className={fadedClass}>{HumanName(uniqueName)}</span>
      </td>
      <td>
        <span className={fadedClass}>
          {requirement.quantityTotal}
          {requirement.quantityTotal % requirement.batchSize != 0 &&
            ` (${Math.ceil(requirement.quantityTotal / requirement.batchSize) * requirement.batchSize})`}
        </span>
      </td>
      <td>
        <span className={fadedClass}>{requirement.quantityNeeded}</span>
      </td>
      <td>
        <div className={cx("input-group", "input-group-sm")}>
          <input
            type="number"
            className={cx("form-control")}
            value={quantity.value}
            min={0}
            disabled={uniqueName == "/Lotus/Types/Items/MiscItems/ArgonCrystal"}
            onChange={(evt) => {
              let newQ = evt.currentTarget.valueAsNumber;
              if (isNaN(newQ)) newQ = 0;
              quantity.value = Math.max(0, newQ);
            }}
          />
          <button className={cx("btn", "btn-primary")} onClick={(_) => (quantity.value = requirement.quantityTotal)}>
            Fill
          </button>
          <button className={cx("btn", "btn-danger")} onClick={(_) => (quantity.value = 0)}>
            Reset
          </button>
        </div>
      </td>
    </tr>
  );
}
