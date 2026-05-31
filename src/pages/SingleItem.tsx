import { useRoute } from "preact-iso";
import { useContext } from "preact/hooks";
import { HumanName, Thumbnail } from "../components/util";
import { AppState } from "../data";
import cx from "../style";

export function SingleItem() {
  const rte = useRoute();
  const { manifest } = useContext(AppState);

  const item = manifest.exports["ExportWeapons"].find(
    (w) => w.uniqueName.slice(1) == rte.params["path"],
  );

  if (item == null) return <div>Unknown item</div>;

  const recipe = manifest.exports["ExportRecipes"].find(
    (c) => c.resultType == item.uniqueName,
  );

  return (
    <div className={cx("container")}>
      <div className={cx("card")}>
        <div className={cx("card-body")}>
          <h5 className={cx("card-title")}>{item.name}</h5>
          {recipe != null && (
            <ul>
              {recipe.ingredients.map((i, k) => (
                <li key={k}>
                  <Thumbnail id={i.ItemType} width="32px" />
                  {HumanName(i.ItemType)} x{i.ItemCount}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
