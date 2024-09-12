const cwd = process.cwd();
const desktopEntry = (name) => `#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=${name}
Exec=${cwd}/${name}/${name}-linux-x64/${name}
Icon=${cwd}/${name}/${name}.svg
StartupWMClass=${name}`;
const name = process.argv[2];
const itemPath = `${cwd}/../../.local/share/applications/${name}.desktop`;
console.info(`Writing desktop entry for ${name} at ${itemPath}`);


require("fs").writeFileSync(itemPath, desktopEntry(name));
console.info("Done writing desktop entry");
