import { Attributes } from "preact";
import { hydrate, LocationProvider, Route, Router, prerender as ssr } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { AppState, createAppState, TAppState } from "./AppState.js";
import ListInventory from "./inventory/List.js";
import ViewItem from "./inventory/ViewItem.js";
import { completed, Deferred, pending } from "./util";

import "@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2";
import "./style.module.scss";

function App() {
  const [appState, setAppState] = useState(pending<TAppState>());

  useEffect(() => {
    createAppState()
      .then((as_) => setAppState(completed(as_)))
      .catch(console.error);
  }, [setAppState]);

  return (
    <Deferred value={appState}>
      {(arg) => (
        <LocationProvider>
          <AppState.Provider value={arg}>
            <Router>
              <Route path="/" component={ListInventory} />
              <Route path="/item/:path*" component={ViewItem} />
              <Route default component={() => <p>Not found.</p>} />
            </Router>
          </AppState.Provider>
        </LocationProvider>
      )}
    </Deferred>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app")!);
}

export async function prerender(data: Attributes) {
  return await ssr(<App {...data} />);
}
