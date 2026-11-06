const fs = require("node:fs");
const path = require("node:path");
const cwd = process.cwd();
// Native Wayland drag-and-drop in Chromium/Electron can freeze the whole window on
// KDE Plasma when an element is dragged inside the page. Running through XWayland
// avoids it. The flag must be on the real command line: setting it from the main
// process at runtime only reaches the GPU process and crashes it.
// Override with ELECTRON_OZONE_PLATFORM=wayland to opt out.
const ozonePlatform = process.env.ELECTRON_OZONE_PLATFORM || "x11";
const extraArgs = ` --ozone-platform=${ozonePlatform}`;
const desktopEntry = (name) => {
  const appFolder = path.join(cwd, name);
  const binName = JSON.parse(
    fs.readFileSync(path.join(appFolder, "package.json"), "utf8"),
  ).name;

  return `#!/usr/bin/env xdg-open
  [Desktop Entry]
  Version=1.0
  Terminal=false
  Type=Application
  Name=${name}
  Exec=${appFolder}/${binName}-linux-x64/${binName}${extraArgs}
  Icon=${appFolder}/${name}.${fs.existsSync(path.join(appFolder, `${name}.png`)) ? "png" : "svg"}
  StartupWMClass=${binName}`;
};
const name = process.argv[2];
const itemPath = `${cwd}/../../.local/share/applications/${name}.desktop`;
console.info(`Writing desktop entry for ${name} at ${itemPath}`);

require("fs").writeFileSync(itemPath, desktopEntry(name));
console.info("Done writing desktop entry");
