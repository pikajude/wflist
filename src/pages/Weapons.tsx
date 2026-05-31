import {
  Signal,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import { List, Map } from "immutable";
import { Attributes } from "preact";
import { useCallback, useContext } from "preact/hooks";
import { Checkbox } from "../components/input";
import { HumanName, Thumbnail } from "../components/util";
import { AppState } from "../data";
import { CraftList } from "../data/craftList";
import { ExportWeapon } from "../data/schema";
import cx from "../style";

const categoryMap = {
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  All: [],
} as const;

// apparently planet-specific rare items used to be craftable in exchange for a ridiculous quantity of common stuff
export const ResourcesLegacyCraftable = [
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

export const InvasionResources = [
  "/Lotus/Types/Items/Research/BioComponent",
  "/Lotus/Types/Items/Research/ChemComponent",
  "/Lotus/Types/Items/Research/EnergyComponent",
];

type SelectedCategory = keyof typeof categoryMap;

const modularRegexp = new RegExp(
  "^(/Lotus/Types/Friendly/Pets/CreaturePets/CreaturePetParts/Deimos|/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts|/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts|/Lotus/Types/Items/Deimos/WoundedInfested|/Lotus/Types/Vehicles/Hoverboard/HoverboardParts|/Lotus/Weapons/Corpus/OperatorAmplifiers|/Lotus/Weapons/Infested/Pistols/InfKitGun|/Lotus/Weapons/Ostron/Melee/ModularMelee|/Lotus/Weapons/Sentients/OperatorAmplifiers|/Lotus/Weapons/SolarisUnited|/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire)",
);

const excludeModular = (weapons: ExportWeapon[]) =>
  weapons.filter((w) => !w.uniqueName.match(modularRegexp));

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
  const allWeapons = useSignal(
    List(excludeModular(manifest.exports["ExportWeapons"])),
  );

  const showImage = useSignal(true);
  const showMastered = useSignal(true);
  const useInvasions = useSignal(true);

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

  const craftListLoading = useSignal(true);
  const craftList = useSignal(new CraftList(manifest, true));
  const ingredientsFlat = useSignal<[string, [string, number]][]>([]);

  useSignalEffect(() => {
    useInvasions.value;
    weapons.value;
    craftListLoading.value = true;
    setTimeout(async () => {
      console.log("starting expensive computation");
      var cl = new CraftList(
        manifest,
        useInvasions.value,
        weapons.value.map((w) => w.uniqueName),
      );
      craftList.value = cl;
      ingredientsFlat.value = cl.flattened();
      craftListLoading.value = false;
    }, 0);
  });

  const collapseShow = useSignal(false);

  return (
    <>
      <nav className={cx("navbar")}>
        <ul className={cx("nav", "nav-underline", "mb-2")}>
          {tab("Primary")}
          {tab("Secondary")}
          {tab("Melee")}
          {tab("All")}
        </ul>
        <div>
          <button
            className={cx("btn", "btn-primary")}
            onClick={() => (collapseShow.value = !collapseShow.value)}
          >
            {collapseShow.value ? "Hide options" : "Show options"}
          </button>
        </div>
      </nav>
      <div className={cx("user-select-none", "d-flex", "justify-content-end")}>
        <div className={cx("collapse", "mb-2", { show: collapseShow.value })}>
          <Checkbox
            value={useInvasions}
            label="Research components come from invasions"
          />
          <Checkbox value={showImage} label="Enable images" />
          <Checkbox value={showMastered} label="Show mastered" />
        </div>
      </div>
      <div className={cx("container")}>
        <div className={cx("grid")}>
          <div
            className={cx("card", "overflow-y-scroll", "g-col-12")}
            style={{ maxHeight: "400px" }}
          >
            <div className={cx("card-body")}>
              <h5 className={cx("card-title")}>Total required resources:</h5>
              <ul>
                {ingredientsFlat.value.map((e) => (
                  <li>
                    <Thumbnail id={e[0]} width="32px" /> {HumanName(e[0])}:{" "}
                    {e[1][1]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
