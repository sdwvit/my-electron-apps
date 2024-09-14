import { BrowserWindow, MenuItem, ipcMain } from "electron";
import { addSearch } from "./addSearch";
import { createContextMenu } from "./createContextMenu";
import { handleExternalLinks } from "./handleExternalLinks";

export function createWindow(address: string, additionalContextMenu: any[]) {
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

  const state: { win: any } = { win };
  addSearch(state);

  // Event listeners for external links
  win.webContents.on("will-navigate", (event, url) =>
    handleExternalLinks(event, url, win),
  );
  win.webContents.on(
    "new-window" as any,
    (event: Electron.Event<{}>, url: string) =>
      handleExternalLinks(event, url, win),
  );

  // Custom context menu
  win.webContents.on("context-menu", (event, params) => {
    const menu = createContextMenu(
      win,
      params,
      address,
      additionalContextMenu,
      createWindow,
    );
    additionalContextMenu.forEach((item: any) =>
      menu.append(new MenuItem(item)),
    );
    menu.popup();
  });

  ipcMain.on("open-new-window", (event, params) => {
    const { url } = params;
    const newWindow = createWindow(url, additionalContextMenu);

    newWindow.loadURL(url || address); // Default to a URL if none provided
  });

  win.loadURL(address);
  return win;
}
