// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";
var pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@": resolve("src/renderer/src")
      }
    },
    plugins: [tailwindcss(), react()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    }
  }
});
export {
  electron_vite_config_default as default
};
