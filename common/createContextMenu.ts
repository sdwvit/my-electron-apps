import { BrowserWindow, clipboard, Menu, MenuItem } from "electron";

export function createContextMenu(
  win: BrowserWindow,
  params: any,
  homeUrl: string,
  additionalContextMenu: any[],
  createWindow: (url: string, additionalContextMenu: any[]) => BrowserWindow,
) {
  const menu = new Menu();

  const navigationItems = [
    {
      label: "Back",
      click: () => win.webContents.navigationHistory.goBack(),
      enabled: win.webContents.navigationHistory.canGoBack(),
    },
    {
      label: "Forward",
      click: () => win.webContents.navigationHistory.goForward(),
      enabled: win.webContents.navigationHistory.canGoForward(),
    },
    { label: "Home page", click: () => win.loadURL(homeUrl) },
    {
      label: "Duplicate window",
      click: () =>
        createWindow(win.webContents.getURL(), additionalContextMenu),
    },
    {
      label: "Copy Current Address",
      click: () => clipboard.writeText(win.webContents.getURL()),
    },
    params.linkURL
      ? {
          label: "Copy Link Address",
          click: () => clipboard.writeText(params.linkURL),
        }
      : null,
  ].filter(Boolean);

  const standardItems = [
    { role: "cut", label: "Cut" },
    { role: "copy", label: "Copy" },
    { role: "paste", label: "Paste" },
    {
      label: "Inspect",
      click: () => {
        win.webContents.inspectElement(params.x, params.y);
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.devToolsWebContents?.focus();
        }
      },
    },
  ].filter(Boolean);

  [...navigationItems, ...standardItems].forEach((item: any) =>
    menu.append(new MenuItem(item)),
  );
  return menu;
}
