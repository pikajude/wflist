import { HTMLAttributes } from "preact";
import { CraftRequirement } from "../../data/craftList";
import { CraftData } from "../../pages/itemBrowser/CraftData";
import cx from "../../style";
import { Deferred } from "../Deferred";
import { HumanName, Texture } from "../util";

export default function IngredientsCard({
  craftData,
  ...attrs
}: {
  craftData: CraftData;
} & HTMLAttributes<HTMLDivElement>) {
  const { ingredientsFlat: ingredients, ownedIngredients } = craftData;

  return (
    <div className={cx("card", "overflow-y-scroll", "g-col-12", "mt-2", "mb-2")} {...attrs}>
      <div className={cx("card-body")}>
        <h5 className={cx("card-title")}>Total required resources</h5>
        <table className={cx("table", "table-striped")}>
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
        <Texture id={uniqueName} width="32px" /> {HumanName(uniqueName)}
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
