import { Attributes } from "preact";
import { hydrate, LocationProvider, Route, Router, prerender as ssr } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { completed, Deferred, Lazy, pending } from "./components/Deferred.js";
import { AppState, createAppState, TState } from "./data/state.js";
import { NotFound } from "./pages/_404.jsx";
import Browse from "./pages/Browse.js";
import ViewItem from "./pages/ViewItem.js";
import "./style.module.scss";

import "@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2";

function App() {
  const [appState, setAppState] = useState<Lazy<TState>>(pending());

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
              <Route path="/" component={Browse} />
              <Route path="/item/:path*" component={ViewItem} />
              <Route default component={NotFound} />
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
