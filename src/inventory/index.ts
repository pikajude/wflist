import { computed, ReadonlySignal, signal, Signal } from "@preact/signals";
import { createContext } from "preact";
import z from "zod";
import { TAppState } from "../AppState";
import { ADVERSARY } from "../publicExport";
import { ExportSentinel, ExportWarframe, ExportWeapon } from "../publicExport/schema";
import { RouteSignal, sortWith } from "../util";
import { stored } from "../util/storage";
import { Categories, categorize, Category, isExcluded } from "./category";

export { Category };

export const InventoryOptions = z
  .object({
    showImages: z.boolean().default(true),
    hideCrafted: z.boolean().default(true),
    hideVaulted: z.boolean().default(true),
    useInvasions: z.boolean().default(true),
    modular: z
      .object({
        ampBrace: z.string().default(""),
        ampScaffold: z.string().default(""),
        gunGrip: z.string().default(""),
        gunLoader: z.string().default(""),
        boardNose: z.string().default(""),
        boardJet: z.string().default(""),
        boardReactor: z.string().default(""),
        zawGrip: z.string().default(""),
        zawLink: z.string().default(""),
        moaCore: z.string().default(""),
        moaGyro: z.string().default(""),
        moaBracket: z.string().default(""),
        predAntigen: z.string().default(""),
        predMutagen: z.string().default(""),
        vulpAntigen: z.string().default(""),
        vulpMutagen: z.string().default(""),
      })
      .prefault({}),
  })
  .prefault({});

export type InventoryOptions = z.output<typeof InventoryOptions>;

export type Item = ExportWeapon | ExportWarframe | ExportSentinel;

export type TInventoryState = {
  items: ReadonlySignal<Item[]>;
  category: ReadonlySignal<Category>;
  options: Signal<InventoryOptions>;
  searchQuery: Signal<string>;
};

const PermaVaulted = [
  "/Lotus/Powersuits/Excalibur/ExcaliburPrime",
  "/Lotus/Weapons/Tenno/Pistol/LatoPrime",
  "/Lotus/Weapons/Tenno/Melee/LongSword/SkanaPrime",
];

const isCategory = (c: Category, i: Item) => c == "All" || Categories[c].includes(categorize(i));

const matchesQuery = (query: string, item: Item) => {
  const q = query.toLowerCase();

  return item.uniqueName.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
};

export async function createInventoryState(
  appState: TAppState,
  route: RouteSignal | Signal<string>,
): Promise<TInventoryState> {
  const { manifest, craftedItems } = appState;

  const ws: Item[] = [
    ...manifest.exports["ExportWeapons"].filter((w) => !isExcluded(w) && !ADVERSARY.includes(w.uniqueName)),
    ...manifest.exports["ExportWarframes"],
    ...manifest.exports["ExportSentinels"],
  ].filter((w) => !PermaVaulted.includes(w.uniqueName));

  // dedup items. the export contains 3 identical copies of Mausolon. cause why not
  const allItems = Object.entries(Object.fromEntries(ws.map((w) => [w.uniqueName, w]))).map((e) => e[1]);

  const category = computed(() => {
    const requested = route instanceof Signal ? route.value : route.query.value["category"];
    return Category.safeParse(requested).data ?? "All";
  });

  const options = await stored("wfListFilters", InventoryOptions);

  const searchQuery = signal("");

  const items = computed(() =>
    sortWith(
      allItems.filter((item) => {
        if (searchQuery.value.length > 0) return matchesQuery(searchQuery.value, item);

        return (
          isCategory(category.value, item) &&
          !(options.value.hideVaulted && manifest.isVaulted(item.uniqueName)) &&
          !(options.value.hideCrafted && craftedItems.value.has(item.uniqueName))
        );
      }),
      (a) => a.name.replace("<ARCHWING> ", ""),
    ),
  );

  return {
    items,
    category,
    options,
    searchQuery,
  };
}

export const makeInventoryState = (category: Category | Signal<Category>) => ({
  category: typeof category === "string" ? signal(category) : category,
  items: signal([]),
  options: signal(InventoryOptions.parse(undefined)),
  searchQuery: signal(""),
});

export const InventoryState = createContext<TInventoryState>(makeInventoryState("All"));
