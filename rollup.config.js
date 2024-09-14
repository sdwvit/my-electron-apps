const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const path = require("node:path");

module.exports = {
  input: "index.ts", // Entry point (index.ts)
  output: {
    file: path.join(process.cwd(), "bundle.js"), // Output single bundle
    format: "cjs", // Output in ES module format
    sourcemap: false, // Set to false if sourcemaps aren't needed
  },
  plugins: [
    resolve(), // Resolve node_modules dependencies
    commonjs(), // Convert CommonJS modules to ES6
    typescript({
      tsconfig: path.join(process.cwd(), "../tsconfig.json"), // Pointing to tsconfig.json one level up
    }),
  ],
  external: [], // List any external dependencies
};
