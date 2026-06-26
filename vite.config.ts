import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { patchCssModules } from "vite-css-modules";

export default defineConfig({
  css: {
    modules: {},
  },
  plugins: [
    patchCssModules({
      generateSourceTypes: true,
      declarationMap: true,
    }),
    preact({
      prerender: {
        enabled: true,
        renderTarget: "#app",
        additionalPrerenderRoutes: ["/404"],
        previewMiddlewareEnabled: true,
        previewMiddlewareFallback: "/404",
      },
    }),
  ],
});
