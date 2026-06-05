import { hydrate, LocationProvider, Route, Router, prerender as ssr } from "preact-iso";

import { Attributes } from "preact";
import { AppState, createAppState, TState } from "./data/index.js";
import { NotFound } from "./pages/_404.jsx";
import Browse from "./pages/itemBrowser/Browse.js";
import ViewItem from "./pages/ViewItem.js";
import "./style.module.scss";

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
