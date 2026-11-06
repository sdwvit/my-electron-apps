const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const path = require("node:path");

const plugins = () => [
  resolve(), // Resolve node_modules dependencies
  commonjs(), // Convert CommonJS modules to ES6
  json(), // Allow importing JSON (dotenv package.json)
  typescript({
    tsconfig: path.join(process.cwd(), "../tsconfig.json"), // Pointing to tsconfig.json one level up
  }),
];

module.exports = [
  {
    input: "index.ts", // App entry point (main process)
    output: {
      file: path.join(process.cwd(), "bundle.js"),
      format: "cjs",
      sourcemap: false,
    },
    plugins: plugins(),
    // Keep Electron as a runtime dependency so it isn't bundled into bundle.js.
    external: ["electron"],
  },
  {
    // Shared page preload, registered for every page in common/index.ts.
    input: path.join(__dirname, "common/preload.ts"),
    output: {
      file: path.join(process.cwd(), "preload.js"),
      format: "cjs",
      sourcemap: false,
    },
    plugins: plugins(),
    external: ["electron"],
  },
];
