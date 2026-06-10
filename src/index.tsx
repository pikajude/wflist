import { Signal } from "@preact/signals";
import { Set } from "immutable";
import { Attributes, createContext } from "preact";
import { hydrate, LocationProvider, Route, Router, prerender as ssr } from "preact-iso";
import { Wanifest } from "./data/wanifest.js";
import { NotFound } from "./pages/_404.jsx";
import Browse from "./pages/Browse.js";
import ViewItem from "./pages/ViewItem.js";
import "./style.module.scss";
import { stored, storedWith } from "./util.js";

export type TState = {
  manifest: Wanifest;

  masteredWeapons: Signal<Set<string>>;

  ingredientsOwned: Signal<Record<string, number>>;
};

export async function createAppState(): Promise<TState> {
  const manifest = await Wanifest.create();

  const masteredWeapons = storedWith<Set<string>>(
    "wfListMastered",
    (v) => Set(v == null ? [] : (JSON.parse(v) as string[])),
    (m) => JSON.stringify(m.toArray()),
  );

  const ingredientsOwned = stored<Record<string, number>>("wfListIngredients", {});

  return {
    manifest,
    masteredWeapons,
    ingredientsOwned,
  };
}

export const AppState = createContext({} as TState);

export function App(props: { state: TState }) {
  return (
    <AppState.Provider value={props.state}>
      <LocationProvider>
        {/* <Header /> */}
        <Router>
          <Route path="/" component={Browse} />
          <Route path="/item/:path*" component={ViewItem} />
          <Route default component={NotFound} />
        </Router>
      </LocationProvider>
    </AppState.Provider>
  );
}

if (typeof window !== "undefined") {
  void createAppState().then((s) => {
    const el = document.getElementById("app")!;
    el.innerHTML = "";
    hydrate(<App state={s} />, el);
  });
}

export async function prerender(data: Attributes) {
  const st = await createAppState();
  return await ssr(<App state={st} {...data} />);
}
