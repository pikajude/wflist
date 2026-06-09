import { useSignal, useSignalEffect } from "@preact/signals";
import { useContext, useState } from "preact/hooks";
import { AppState } from "../data";
import { CraftData, CraftRequirement } from "../data/craftList";
import cx from "../style";
import { HumanName, Texture, useField } from "./util";

export default function IngredientTable(props: { craftData: CraftData; startOpen: boolean }) {
  const {
    craftData: { ingredientsFlat: ingredients },
    startOpen,
  } = props;
  const { ingredientsOwned } = useContext(AppState);
  const expanded = useSignal(startOpen);

  const [lastIngredients, setLastIngredients] = useState<[string, CraftRequirement][]>([]);

  useSignalEffect(() => {
    const i = ingredients.value;
    if (i.state == "done") setLastIngredients(i.value);
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
            <button className={cx("btn", "btn-sm", "btn-danger")} onClick={() => (ingredientsOwned.value = {})}>
              Clear inventory
            </button>
            <table className={cx("table", "table-striped", "table-sm", "align-middle")}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Needed</th>
                  <th>Owned</th>
                </tr>
              </thead>
              <tbody>
                {lastIngredients.map(([uniqueName, req]) => (
                  <IngredientRow uniqueName={uniqueName} requirement={req} key={uniqueName} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IngredientRow({ uniqueName, requirement }: { uniqueName: string; requirement: CraftRequirement }) {
  if (requirement.quantity == 0 || requirement.toplevel) return null;

  const { ingredientsOwned } = useContext(AppState);

  const quantity = useField(ingredientsOwned, uniqueName, 0);

  return (
    <tr>
      <td>
        <Texture id={uniqueName} width="24px" /> {HumanName(uniqueName)}
      </td>
      <td>{requirement.quantity}</td>
      <td>
        <div className={cx("input-group", "input-group-sm")}>
          <input
            type="number"
            className={cx("form-control")}
            value={quantity.value}
            min={0}
            onChange={(evt) => (quantity.value = Math.max(0, evt.currentTarget.valueAsNumber))}
          />
          <button className={cx("btn", "btn-primary")} onClick={(_) => (quantity.value += requirement.quantity)}>
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
