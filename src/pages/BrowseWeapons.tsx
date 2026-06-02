import { ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { List, Set } from "immutable";
import { createContext, HTMLAttributes } from "preact";
import { useContext, useState } from "preact/hooks";
import { usePopper } from "react-popper";
import { completed, Deferred, Lazy, pending } from "../components/Deferred";
import { Checkbox, CheckboxF, toggle } from "../components/input";
import { HumanName, Texture, useStored, useStoredWith } from "../components/util";
import { AppState } from "../data";
import { CraftList, CraftRequirement } from "../data/craftList";
import { ExportWeapon } from "../data/schema";
import allVaulted from "../data/vaulted.json";
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

type TBrowserContext = {
  _allWeapons: ReadonlySignal<List<ExportWeapon>>;
  weapons: ReadonlySignal<Array<ExportWeapon>>;

  category: Signal<SelectedCategory>;

  craftList: ReadonlySignal<Lazy<CraftList>>;
  ingredientsFlat: ReadonlySignal<Lazy<ReturnType<CraftList["flattened"]>>>;
  ownedIngredients: Signal<Record<string, number>>;

  options: {
    showImages: Signal<boolean>;
    showMastered: Signal<boolean>;
    useInvasions: Signal<boolean>;
    masteredWeapons: Signal<Set<string>>;
  };
};

const BrowserContext = createContext({} as TBrowserContext);

function createBrowserContext(): TBrowserContext {
  const { manifest } = useContext(AppState);
  const allWeapons = useSignal(List(excludeModular(manifest.exports["ExportWeapons"])));

  const urlHash = window.location.hash.length == 0 ? "#Primary" : window.location.hash.slice(1);
  const initialCategory = urlHash in categoryMap ? (urlHash as SelectedCategory) : "Primary";

  const category = useSignal<SelectedCategory>(initialCategory);

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

  const craftList = useSignal<Lazy<CraftList>>(pending());
  const ingredientsFlat = useSignal<Lazy<ReturnType<CraftList["flattened"]>>>(pending());

  const ownedIngredients = useSignal<Record<string, number>>({});

  useSignalEffect(() => {
    useInvasions.value;
    weapons.value;
    craftList.value = pending();
    ingredientsFlat.value = pending();
    setTimeout(() => {
      console.log("assembling craft list...");
      craftList.value = completed(
        new CraftList(
          manifest,
          useInvasions.value,
          weapons.value.map((w) => w.uniqueName),
        ),
      );
    });
  });

  useSignalEffect(() => {
    ownedIngredients.value;
    if (craftList.value.state == "done") {
      const ref_ = craftList.value.value;
      setTimeout(() => {
        console.log("calculating flat materials list...");
        ingredientsFlat.value = completed(ref_.flattened(ownedIngredients.value));
      });
    }
  });

  return {
    _allWeapons: allWeapons,
    weapons,

    category,

    craftList,
    ingredientsFlat,
    ownedIngredients,

    options: {
      showImages: showImage,
      showMastered: showMastered,
      useInvasions: useInvasions,
      masteredWeapons: masteredWeapons,
    },
  };
}

export function BrowseWeapons() {
  const vContext = createBrowserContext();

  const { weapons } = vContext;

  return (
    <BrowserContext value={vContext}>
      <nav className={cx("navbar")}>
        <ul className={cx("nav", "nav-underline", "mb-2")}>
          <Tab label="Primary" />
          <Tab label="Secondary" />
          <Tab label="Melee" />
          <Tab label="All" />
        </ul>
        <FilterOptions />
      </nav>
      <div className={cx("container")}>
        <div className={cx("grid")}>
          <IngredientsCard style={{ height: "320px" }} />
          {weapons.value.map((c, i) => (
            <WeaponCard weapon={c} key={i} />
          ))}
        </div>
      </div>
    </BrowserContext>
  );
}

function Tab(props: { label: SelectedCategory }) {
  const { category } = useContext(BrowserContext);
  const { label } = props;

  return (
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
}

function FilterOptions() {
  const {
    options: { showImages, showMastered, useInvasions, masteredWeapons },
  } = useContext(BrowserContext);

  const [visible, setVisible] = useState(false);

  const [refEl, setRefEl] = useState<HTMLButtonElement | null>(null);
  const [popEl, setPopEl] = useState<HTMLDivElement | null>(null);
  const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(refEl, popEl, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "arrow",
        options: { element: arrowEl },
      },
    ],
  });

  return (
    <div className={cx(visible ? "dropup" : "dropdown")}>
      <button
        className={cx("btn", "btn-primary", "dropdown-toggle")}
        ref={setRefEl}
        onClick={() => setVisible((v) => !v)}
      >
        Options
      </button>

      {visible && (
        <div
          ref={setPopEl}
          className={cx("dropdown-menu", { show: visible })}
          style={styles.popper}
          {...attributes.popper}
        >
          <form className={cx("px-3", "py-2")} style={{ width: "400px" }}>
            <Checkbox name="useInv" value={useInvasions} label="Research components come from invasions" />
            <Checkbox name="showIm" value={showImages} label="Enable images" />
            <Checkbox name="showMa" value={showMastered} label="Show mastered" />
            <hr />
            <button onClick={() => (masteredWeapons.value = Set())} className={cx("btn", "btn-danger", "btn-sm")}>
              Clear mastery
            </button>
          </form>

          <div ref={setArrowEl} style={styles.arrow} />
        </div>
      )}
    </div>
  );
}

function WeaponCard(
  props: {
    weapon: ExportWeapon;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { weapon, ...rest } = props;
  const {
    options: { showImages: showImage, masteredWeapons },
  } = useContext(BrowserContext);

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
        {showImage.value ? (
          <>
            <a href={`/item${weapon.uniqueName}`}>
              <Texture id={weapon.uniqueName} className={cx("img-fluid")} />
            </a>
            <div className={cx("card-text")}>{weapon.name}</div>
          </>
        ) : (
          <div className={cx("card-text")}>
            <a href={`/item${weapon.uniqueName}`}>{weapon.name}</a>
          </div>
        )}
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

export function IngredientsCard(attrs: HTMLAttributes<HTMLDivElement>) {
  const vContext = useContext(BrowserContext);

  const { ingredientsFlat: ingredients } = vContext;

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
                is.map(([uniqueName, req], i) => <IngredientRow uniqueName={uniqueName} requirement={req} key={i} />)
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

function IngredientRow({
  uniqueName,
  requirement,
  key,
}: {
  uniqueName: string;
  requirement: CraftRequirement;
  key: number;
}) {
  if (requirement.quantity == 0 || requirement.toplevel) return null;

  const { ownedIngredients } = useContext(BrowserContext);

  return (
    <tr key={key}>
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
