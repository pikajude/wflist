import { useSignal, useSignalEffect } from "@preact/signals";
import { useContext, useState } from "preact/hooks";
import { CraftData, CraftRequirement } from "../data/craftList";
import { AppState } from "../data/state";
import cx from "../style";
import { HumanName, Texture, useField } from "../util";
import { Checkbox } from "./input";

export default function IngredientTable(props: { craftData: CraftData; startOpen: boolean }) {
  const {
    craftData: { ingredientsFlat: ingredients },
    startOpen,
  } = props;
  const { ingredientsOwned } = useContext(AppState);
  const expanded = useSignal(startOpen);
  const onlyMissing = useSignal(true);

  const [lastIngredients, setLastIngredients] = useState<[string, CraftRequirement][]>([]);

  useSignalEffect(() => {
    const i = ingredients.value;
    const filt = onlyMissing.value;
    if (i.state == "done") {
      setLastIngredients(i.value.filter((v) => !v[1].toplevel && (!filt || v[1].quantityNeeded > 0)));
    }
  });

  return (
    <div className={cx("accordion", "g-col-12")}>
      <div className={cx("accordion-item")}>
        <h2 className={cx("accordion-header")}>
          <button
            className={cx("accordion-button", { collapsed: !expanded.value })}
            onClick={() => (expanded.value = !expanded.value)}
          >
            Ingredients
          </button>
        </h2>
        <div className={cx("accordion-collapse", "collapse", { show: expanded.value })}>
          <div className={cx("accordion-body")}>
            <div className={cx("d-flex", "justify-content-between")}>
              <Checkbox value={onlyMissing} label="Only show missing items" />
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
                {lastIngredients.map(([uniqueName, req]) => (
                  <IngredientRow uniqueName={uniqueName} requirement={req} key={uniqueName} />
                ))}
                {lastIngredients.length == 0 && (
                  <tr>
                    <td colspan={4}>All ingredients collected</td>
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

  const quantity = useField(ingredientsOwned, uniqueName, 0);

  if (requirement.toplevel) return null;

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
