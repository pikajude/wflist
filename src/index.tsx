import {
  hydrate,
  LocationProvider,
  Route,
  Router,
  prerender as ssr,
} from "preact-iso";

import { Attributes } from "preact";
import { Header } from "./components/Header.js";
import { AppState, createAppState, TState } from "./data/index.js";
import { SingleItem } from "./pages/SingleItem.js";
import { BrowseWeapons } from "./pages/Weapons.js";
import { NotFound } from "./pages/_404.jsx";
import cx from "./style.js";
import "./style.module.scss";

export function App(props: { state: TState }) {
  return (
    <AppState.Provider value={props.state}>
      <LocationProvider>
        <Header />
        <main className={cx("container")}>
          <Router>
            <Route path="/" component={BrowseWeapons} />
            <Route path="/item/:path*" component={SingleItem} />
            <Route default component={NotFound} />
          </Router>
        </main>
      </LocationProvider>
    </AppState.Provider>
  );
}

if (typeof window !== "undefined") {
  createAppState().then((s) => {
    const el = document.getElementById("app")!;
    el.innerHTML = "";
    hydrate(<App state={s} />, el);
  });
}

export async function prerender(data: Attributes) {
  const st = await createAppState();
  return await ssr(<App state={st} {...data} />);
}
