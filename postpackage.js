const fs = require("node:fs");
const path = require("node:path");
const cwd = process.cwd();
const desktopEntry = (name) => {
  const appFolder = path.join(cwd, name);

  return `#!/usr/bin/env xdg-open
  [Desktop Entry]
  Version=1.0
  Terminal=false
  Type=Application
  Name=${name}
  Exec=${appFolder}/${name.toLowerCase()}-electron-linux-x64/${name.toLowerCase()}-electron
  Icon=${appFolder}/${name}.${fs.existsSync(path.join(appFolder, `${name}.png`)) ? "png" : "svg"}
  StartupWMClass=${name}`;
};
const name = process.argv[2];
const itemPath = `${cwd}/../../.local/share/applications/${name}.desktop`;
console.info(`Writing desktop entry for ${name} at ${itemPath}`);

require("fs").writeFileSync(itemPath, desktopEntry(name));
console.info("Done writing desktop entry");
