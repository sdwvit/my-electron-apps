function start(address, deps) {
  const { app, BrowserWindow, shell, Menu, MenuItem, clipboard } = deps;
  function createWindow(address) {
    const win = new BrowserWindow({
      width: 1024,
      height: 800,
      frame: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    win.webContents.on("will-navigate", handleExternalLinks);
    win.webContents.on("new-window", handleExternalLinks);
    // Add custom context menu
    win.webContents.on("context-menu", (event, params) => {
      const menu = new Menu();

      // Add "Back" menu item
      menu.append(
        new MenuItem({
          label: "Back",
          click: () => {
            win.webContents.navigationHistory.goBack();
          },
          enabled: win.webContents.navigationHistory.canGoBack(),
        }),
      );

      // Add "Forward" menu item
      menu.append(
        new MenuItem({
          label: "Forward",
          click: () => {
            win.webContents.navigationHistory.goForward();
          },
          enabled: win.webContents.navigationHistory.canGoForward(),
        }),
      );
      // Add standard actions
      menu.append(new MenuItem({ role: "cut", label: "Cut" }));
      menu.append(new MenuItem({ role: "copy", label: "Copy" }));
      menu.append(new MenuItem({ role: "paste", label: "Paste" }));


      // Add "Copy Link Address" if a link is clicked
      if (params.linkURL) {
        menu.append(
          new MenuItem({
            label: "Copy Link Address",
            click: () => {
              clipboard.writeText(params.linkURL);
            },
          }),
        );
      }

      // Add "Inspect Element"
      menu.append(
        new MenuItem({
          label: "Inspect",
          click: () => {
            win.webContents.inspectElement(params.x, params.y);
            if (win.webContents.isDevToolsOpened()) {
              win.webContents.devToolsWebContents.focus();
            }
          },
        }),
      );

      menu.popup();
    });
    win.loadURL(address);
    return win;
  }

  function handleExternalLinks(event, url) {
    const win = BrowserWindow.getFocusedWindow();

    if (
      url !== win.webContents.getURL() &&
      !url.includes("auth") &&
      !url.includes("signin")
    ) {
      event.preventDefault();
      shell.openExternal(url);
    }
  }

  app.whenReady().then(() => createWindow(address));

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

start(
  "https://console.cloud.google.com/logs/",
  require("electron"),
);
