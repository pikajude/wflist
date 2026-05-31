import { Signal, useComputed, useSignal } from "@preact/signals";
import { List, Map } from "immutable";
import { Attributes } from "preact";
import { useCallback, useContext } from "preact/hooks";
import { Checkbox } from "../components/input";
import { HumanName, Thumbnail } from "../components/util";
import { AppState } from "../data";
import { ExportWeapon } from "../data/schema";
import cx from "../style";

const categoryMap = {
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  All: [],
} as const;

// apparently planet-specific rare items used to be craftable in exchange for a ridiculous quantity of common stuff
const resourcesNoLongerCraftable = [
  "/Lotus/Types/Items/MiscItems/Morphic",
  "/Lotus/Types/Items/MiscItems/Neurode",
  "/Lotus/Types/Items/MiscItems/OrokinCell",
  "/Lotus/Types/Items/MiscItems/ControlModule",
  "/Lotus/Types/Items/MiscItems/NeuralSensor",
  "/Lotus/Types/Items/MiscItems/Gallium",
  "/Lotus/Types/Items/RailjackMiscItems/CubicsRailjackItem",
  "/Lotus/Types/Items/RailjackMiscItems/CarbidesRailjackItem",
  "/Lotus/Types/Items/RailjackMiscItems/IsosRailjackItem",
  "/Lotus/Types/Items/RailjackMiscItems/GallosRailjackItem",
];

type SelectedCategory = keyof typeof categoryMap;

export function BrowseWeapons() {
  const { manifest } = useContext(AppState);

  const recipes = manifest.exports["ExportRecipes"];

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
          (category.value == "All" ||
            categoryMap[category.value].includes(
              weapon.productCategory as never,
            )) &&
          (showMastered.value ||
            !masteredWeapons.value.get(weapon.uniqueName, false)),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .toArray(),
  );

  const totalWantedResources = useComputed(() => {
    const resources: { [name: string]: number } = {};

    function calcResources(path: string[], multi = 1) {
      const uniqueName = path[path.length - 1];

      const recipe = recipes.find((c) => c.resultType == uniqueName);
      if (recipe == null) return;

      for (const { ItemType, ItemCount } of recipe.ingredients) {
        if (!(ItemType in resources)) resources[ItemType] = 0;
        if (
          !resourcesNoLongerCraftable.includes(ItemType) &&
          recipes.some((r) => r.resultType == ItemType)
        ) {
          console.log(
            `for ${path.map(HumanName).join(" => ")}: ${ItemType} x${ItemCount}`,
          );
          resources[ItemType] += ItemCount;
          calcResources([...path, ItemType], ItemCount);
        } else {
          const total = ItemCount * Math.ceil(multi / recipe.num);
          console.log(
            `for ${path.map(HumanName).join(" => ")}: ${ItemType} x${total}`,
          );
          if (total > 12500)
            console.warn(`Requirement for ${ItemType} seems too high`);
          // e.g. deimos alloys are crafted in batches of 20, but some recipes need <20, so ensure we round up to the nearest batch size
          resources[ItemType] += total;
        }
      }
    }

    for (const { uniqueName } of weapons.value) calcResources([uniqueName]);

    return resources;
  });

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

  return (
    <>
      <nav className={cx("navbar")}>
        <ul className={cx("nav", "nav-underline", "mb-2")}>
          {tab("Primary")}
          {tab("Secondary")}
          {tab("Melee")}
          {tab("All")}
        </ul>
        <div className={cx("user-select-none")}>
          <Checkbox value={showImage} label="Enable images" />
          <Checkbox value={showMastered} label="Show mastered" />
        </div>
      </nav>
      <div className={cx("container")}>
        <ListResources items={totalWantedResources} />
        <div className={cx("grid", "text-center")}>
          {weapons.value.map((c, i) => (
            <WeaponCard
              weapon={c}
              masteredWeapons={masteredWeapons}
              showImage={showImage}
              onClick={toggleMastery}
              key={`${i}${c.uniqueName}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function ListResources({
  items,
}: {
  items: Signal<{ [name: string]: number }>;
}) {
  return (
    <div className={cx("card")}>
      <div className={cx("card-body")}>
        <ul>
          {Object.entries(items.value).map((entry) => {
            const [key, quant] = entry;
            return (
              <li key={key}>
                <Thumbnail id={key} alt={HumanName(key)} width="32px" />{" "}
                {HumanName(key)} x{quant}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function WeaponCard(
  props: {
    weapon: ExportWeapon;
    masteredWeapons: Signal<Map<string, boolean>>;
    showImage: Signal<boolean>;
    onClick: (key: string) => void;
  } & Attributes,
) {
  const {
    weapon,
    masteredWeapons,
    showImage: showImage,
    onClick,
    ...rest
  } = props;

  const { manifest } = useContext(AppState);

  return (
    <div
      className={cx("card", {
        "g-col-3": showImage.value,
        "g-col-2": !showImage.value,
      })}
      onClick={() => onClick(weapon.uniqueName)}
      {...rest}
    >
      <div className={cx("card-body")}>
        {showImage.value && (
          <img
            src={manifest.image_url(weapon.uniqueName)}
            className={cx("img-fluid")}
          />
        )}
        {masteredWeapons.value.get(weapon.uniqueName, false) && "[M] "}
        {weapon.name}
      </div>
    </div>
  );
}
