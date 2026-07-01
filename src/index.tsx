import { Attributes } from "preact";
import { hydrate, LocationProvider, Route, Router, prerender as ssr } from "preact-iso";
import { AppState, createAppState } from "./AppState.js";
import ListInventory from "./inventory/List.js";
import ViewItem from "./inventory/ViewItem.js";
import { Deferred, useLazy } from "./util";

import "@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2";
import "./style.module.scss";
import Images from "./util/Images.js";

function App() {
  const appState = useLazy(createAppState);

  return (
    <Deferred value={appState}>
      {(arg) => (
        <LocationProvider>
          <AppState.Provider value={arg}>
            <Router>
              <Route path="/" component={ListInventory} />
              <Route path="/textures" component={Images} />
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
