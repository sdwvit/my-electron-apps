const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();

const isPackageDir = (dirPath) =>
  fs.existsSync(path.join(dirPath, "package.json"));

const dirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      !entry.name.startsWith(".") &&
      entry.name !== "node_modules" &&
      entry.name !== "common" &&
      entry.name !== "scripts",
  )
  .map((entry) => entry.name)
  .filter((name) => isPackageDir(path.join(root, name)));

for (const dir of dirs) {
  execFileSync("node", ["postpackage.js", dir], { stdio: "inherit" });
}
