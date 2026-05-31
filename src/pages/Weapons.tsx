import { useComputed, useSignal } from "@preact/signals";
import { List, Map } from "immutable";
import { useLocation } from "preact-iso";
import { useCallback, useContext } from "preact/hooks";
import { Checkbox } from "../components/input";
import { AppState } from "../data";
import cx from "../style";

const categoryMap = {
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
} as const;

type SelectedCategory = keyof typeof categoryMap;

export function BrowseWeapons() {
  const { manifest } = useContext(AppState);

  const urlHash =
    window.location.hash.length == 0
      ? "#Primary"
      : window.location.hash.slice(1);
  const initialCategory =
    urlHash in categoryMap ? (urlHash as SelectedCategory) : "Primary";

  const category = useSignal<SelectedCategory>(initialCategory);
  const allWeapons = useSignal(List(manifest.exports["ExportWeapons"]));

  const showImage = useSignal(true);
  const showMastered = useSignal(true);

  const masteredWeapons = useSignal<Map<string, boolean>>(Map());

  const weapons = useComputed(() =>
    allWeapons.value
      .filter(
        (weapon) =>
          categoryMap[category.value].includes(
            weapon.productCategory as never,
          ) &&
          (showMastered.value ||
            !masteredWeapons.value.get(weapon.uniqueName, false)),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .toArray(),
  );

  const tab = (label: SelectedCategory) => (
    <li className={cx("nav-item")}>
      <a
        className={cx("nav-link", { active: category.value == label })}
        onClick={() => (category.value = label)}
        href={`#${label}`}
      >
        {label}
      </a>
    </li>
  );

  const toggleMastery = useCallback(
    (k: string) => {
      masteredWeapons.value = masteredWeapons.value.update(k, false, (v) => !v);
    },
    [masteredWeapons],
  );

  const { route } = useLocation();

  return (
    <>
      <nav className={cx("navbar")}>
        <ul className={cx("nav", "nav-underline", "mb-2")}>
          {tab("Primary")}
          {tab("Secondary")}
          {tab("Melee")}
        </ul>
        <div className={cx("user-select-none")}>
          <Checkbox value={showImage} label="Enable images" />
          <Checkbox value={showMastered} label="Show mastered" />
        </div>
      </nav>
      <div className={cx("container")}>
        <div className={cx("grid", "text-center")}>
          {weapons.value.map((c, i) => (
            <div
              key={`${i}${c.uniqueName}`}
              className={cx("card", {
                "g-col-3": showImage.value,
                "g-col-2": !showImage.value,
              })}
              onClick={() => route(`/item${c.uniqueName}`)}
            >
              <div className={cx("card-body")}>
                {showImage.value && (
                  <img
                    src={manifest.image_url(c.uniqueName)}
                    className={cx("img-fluid")}
                  />
                )}
                {masteredWeapons.value.get(c.uniqueName, false) && "[M] "}
                {c.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
