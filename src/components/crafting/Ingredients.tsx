import { useSignal } from "@preact/signals";
import { HTMLAttributes } from "preact";
import { CraftRequirement } from "../../data/craftList";
import { CraftData } from "../../pages/itemBrowser/CraftData";
import cx from "../../style";
import { Deferred } from "../Deferred";
import { HumanName, Texture } from "../util";

export default function IngredientsCard({
  craftData,
  startOpen,
  maxHeight,
  ...attrs
}: {
  craftData: CraftData;
  startOpen: boolean;
  maxHeight?: number;
} & HTMLAttributes<HTMLDivElement>) {
  const { ingredientsFlat: ingredients, ownedIngredients } = craftData;

  const expanded = useSignal(startOpen);
  const extra: HTMLAttributes<HTMLDivElement> = {};

  if (maxHeight != null) extra.style = { maxHeight: maxHeight, overflowY: "scroll" };

  return (
    <div className={cx("accordion", "g-col-12")} {...attrs}>
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
          <div className={cx("accordion-body")} {...extra}>
            <table className={cx("table", "table-striped", "table-sm", "align-middle")}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Needed</th>
                  <th>Owned</th>
                </tr>
              </thead>
              <tbody>
                <Deferred
                  value={ingredients.value}
                  ok={(is) =>
                    is.map(([uniqueName, req], i) => (
                      <IngredientRow
                        uniqueName={uniqueName}
                        requirement={req}
                        key={uniqueName}
                        ownedIngredients={ownedIngredients}
                      />
                    ))
                  }
                  pending={
                    <tr>
                      <td colSpan={3}>Calculating...</td>
                    </tr>
                  }
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IngredientRow({
  uniqueName,
  requirement,
  ownedIngredients,
}: {
  uniqueName: string;
  requirement: CraftRequirement;
  ownedIngredients: CraftData["ownedIngredients"];
}) {
  if (requirement.quantity == 0 || requirement.toplevel) return null;

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
            value={ownedIngredients.value[uniqueName] || 0}
            min={0}
            onChange={(evt) => {
              const x = { ...ownedIngredients.value };
              x[uniqueName] = Math.max(0, evt.currentTarget.valueAsNumber);
              ownedIngredients.value = x;
            }}
          />
          <button
            className={cx("btn", "btn-outline-danger")}
            onClick={(evt) => {
              const x = { ...ownedIngredients.value };
              x[uniqueName] = 0;
              ownedIngredients.value = x;
            }}
          >
            Reset
          </button>
        </div>
      </td>
    </tr>
  );
}
