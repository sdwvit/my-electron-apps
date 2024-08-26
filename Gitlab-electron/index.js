function start(address, deps) {
  const { app, BrowserWindow, shell } = deps;
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

    win.loadURL(address);
    return win;
  }

  function handleExternalLinks(event, url) {
    const win = BrowserWindow.getFocusedWindow();

    if (
      url !== win.webContents.getURL() &&
      !url.includes("auth") &&
      !url.includes("sign_in") &&
      !url.includes("gitlab")
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

start("https://gitlab.com/", require("electron"));
