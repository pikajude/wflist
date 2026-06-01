import { Signal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { List, Set } from "immutable";
import { HTMLAttributes } from "preact";
import { useContext } from "preact/hooks";
import { Checkbox, CheckboxF, toggle } from "../components/input";
import { HumanName, Thumbnail, useStored, useStoredWith } from "../components/util";
import { AppState } from "../data";
import { CraftList, CraftRequirement } from "../data/craftList";
import { ExportWeapon } from "../data/schema";
import cx from "../style";

const categoryMap = {
  Primary: ["LongGuns", "OperatorAmps", "SentinelWeapons", "SpaceGuns"],
  Secondary: ["Pistols"],
  Melee: ["Melee", "SpaceMelee"],
  All: [],
} as const;

type SelectedCategory = keyof typeof categoryMap;

const modularRegexp = new RegExp(
  "^(/Lotus/Types/Friendly/Pets/CreaturePets/CreaturePetParts/Deimos|/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts|/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts|/Lotus/Types/Items/Deimos/WoundedInfested|/Lotus/Types/Vehicles/Hoverboard/HoverboardParts|/Lotus/Weapons/Corpus/OperatorAmplifiers|/Lotus/Weapons/Infested/Pistols/InfKitGun|/Lotus/Weapons/Ostron/Melee/ModularMelee|/Lotus/Weapons/Sentients/OperatorAmplifiers|/Lotus/Weapons/SolarisUnited|/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire)",
);

const excludeModular = (weapons: ExportWeapon[]) => weapons.filter((w) => !w.uniqueName.match(modularRegexp));

import allVaulted from "../data/vaulted.json";

export function BrowseWeapons() {
  const { manifest } = useContext(AppState);

  const urlHash = window.location.hash.length == 0 ? "#Primary" : window.location.hash.slice(1);
  const initialCategory = urlHash in categoryMap ? (urlHash as SelectedCategory) : "Primary";

  const category = useSignal<SelectedCategory>(initialCategory);
  const allWeapons = useSignal(List(excludeModular(manifest.exports["ExportWeapons"])));

  const showImage = useStored("wfListShowImage", true);
  const showMastered = useStored("wfListShowMastered", true);
  const useInvasions = useStored("wfListUseInvasions", true);

  const masteredWeapons = useStoredWith<Set<string>>(
    "wfListMastered",
    (v) => Set(v == null ? [] : (JSON.parse(v) as string[])),
    (m) => JSON.stringify(m.toArray()),
  );

  const weapons = useComputed(() =>
    allWeapons.value
      .filter(
        (weapon) =>
          !allVaulted.includes(weapon.uniqueName) &&
          (category.value == "All" || categoryMap[category.value].includes(weapon.productCategory as never)) &&
          (showMastered.value || !masteredWeapons.value.get(weapon.uniqueName, false)),
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

  const craftList = useSignal(new CraftList(manifest, true));
  const craftListLoading = useSignal(true);
  const ingredientsFlat = useSignal<ReturnType<CraftList["flattened"]>>([]);
  const ingredientsFlatLoading = useSignal(true);

  const ownedIngredients = useSignal<Record<string, number>>({});

  useSignalEffect(() => {
    useInvasions.value;
    weapons.value;
    craftListLoading.value = true;
    ingredientsFlatLoading.value = true;
    setTimeout(async () => {
      console.log("assembling craft list...");
      var cl = new CraftList(
        manifest,
        useInvasions.value,
        weapons.value.map((w) => w.uniqueName),
      );
      craftList.value = cl;
      craftListLoading.value = false;
    }, 0);
  });

  useSignalEffect(() => {
    craftList.value;
    ownedIngredients.value;
    setTimeout(async () => {
      console.log("calculating flat materials list...");
      ingredientsFlat.value = craftList.value.flattened(ownedIngredients.value);
      ingredientsFlatLoading.value = false;
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
          <button className={cx("btn", "btn-primary")} onClick={() => (collapseShow.value = !collapseShow.value)}>
            {collapseShow.value ? "Hide options" : "Show options"}
          </button>
        </div>
      </nav>
      <div
        className={cx("user-select-none", "collapse", "mb-2", "justify-content-end", {
          show: collapseShow.value,
          "d-flex": collapseShow.value,
        })}
      >
        <form>
          <Checkbox name="useInv" value={useInvasions} label="Research components come from invasions" />
          <Checkbox name="showIm" value={showImage} label="Enable images" />
          <Checkbox name="showMa" value={showMastered} label="Show mastered" />
          <button onClick={() => (masteredWeapons.value = Set())} className={cx("btn", "btn-danger")}>
            Clear mastery
          </button>
        </form>
      </div>
      <div className={cx("container")}>
        <div className={cx("grid")}>
          <IngredientsCard
            ingredients={ingredientsFlat}
            loading={ingredientsFlatLoading}
            itemsOwned={ownedIngredients}
            style={{ height: "320px" }}
          />
          {weapons.value.map((c, i) => (
            <WeaponCard
              weapon={c}
              masteredWeapons={masteredWeapons}
              showImage={showImage}
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
    masteredWeapons: Signal<Set<string>>;
    showImage: Signal<boolean>;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { weapon, masteredWeapons, showImage, ...rest } = props;

  const { manifest } = useContext(AppState);

  const isChecked = useComputed(() => masteredWeapons.value.has(weapon.uniqueName));

  return (
    <div
      className={cx("card", {
        "g-col-3": showImage.value,
        "g-col-2": !showImage.value,
      })}
      {...rest}
    >
      <div className={cx("card-body")}>
        {showImage.value && <img src={manifest.image_url(weapon.uniqueName)} className={cx("img-fluid")} />}
        <div className={cx("card-text")}>
          <a href={`/item${weapon.uniqueName}`} className={cx("link-info")}>
            {weapon.name}
          </a>
        </div>
        <form>
          <CheckboxF
            value={isChecked}
            onChange={(_) => toggle(masteredWeapons, weapon.uniqueName)}
            name={`${weapon.uniqueName}_ma`}
            label="Mastered"
          />
        </form>
      </div>
    </div>
  );
}

export function IngredientsCard(
  props: {
    ingredients: Signal<ReturnType<CraftList["flattened"]>>;
    loading: Signal<boolean>;
    itemsOwned: Signal<Record<string, number>>;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { ingredients, loading, itemsOwned, ...attrs } = props;

  function IngredientRow({
    uniqueName,
    requirement,
    key,
  }: {
    uniqueName: string;
    requirement: CraftRequirement;
    key: number;
  }) {
    if (requirement.quantity == 0 || requirement.toplevel) return <></>;

    return (
      <tr key={key}>
        <td>
          <Thumbnail id={uniqueName} width="32px" /> {HumanName(uniqueName)}
        </td>
        <td>{requirement.quantity}</td>
        <td>
          <div className={cx("input-group")}>
            <input
              type="number"
              className={cx("form-control")}
              value={itemsOwned.value[uniqueName] || 0}
              min={0}
              onChange={(evt) => {
                const x = { ...itemsOwned.value };
                x[uniqueName] = Math.max(0, evt.currentTarget.valueAsNumber);
                itemsOwned.value = x;
              }}
            />
            <button className={cx("btn", "btn-outline-danger")}>Reset</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className={cx("card", "overflow-y-scroll", "g-col-12", "mt-2", "mb-2")} {...attrs}>
      <div className={cx("card-body")}>
        <h5 className={cx("card-title")}>Total required resources:</h5>
        <table className={cx("table", "table-striped")}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Needed</th>
              <th>Owned</th>
            </tr>
          </thead>
          <tbody>
            {loading.value ? (
              <tr>
                <td colSpan={4}>Calculating...</td>
              </tr>
            ) : (
              ingredients.value.map(([uniqueName, req], i) => (
                <IngredientRow uniqueName={uniqueName} requirement={req} key={i} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
