import { createSearchHTML } from "./createSearchHTML";
import { BrowserWindow, BrowserView, Menu, ipcMain } from "electron";

export function addSearch(state: {
  win: BrowserWindow;
  searchView?: BrowserView | null;
  searchInProgress?: boolean;
}) {
  const { win } = state;

  function createSearchPopup() {
    if (state.searchView) return;

    state.searchView = new BrowserView({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    win.addBrowserView(state.searchView);
    state.searchView.setBounds({ x: 10, y: 10, width: 300, height: 50 });
    state.searchView.webContents.loadURL(createSearchHTML());
    state.searchView.webContents.on("dom-ready", () => {
      state.searchView?.webContents.focus();
    });
  }

  function removeSearchPopup() {
    if (state.searchView) {
      win.removeBrowserView(state.searchView);
      state.searchView = null;
    }
  }

  const menuTemplate = [
    {
      label: "Edit",
      submenu: [
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        {
          label: "Find",
          accelerator: "CmdOrCtrl+F",
          click: () => {
            if (!state.searchInProgress) {
              createSearchPopup();
              state.searchInProgress = true;
            }
          },
        },
        {
          label: "Stop Finding",
          accelerator: "Escape",
          click: () => {
            removeSearchPopup();
            win.webContents.stopFindInPage("clearSelection");
            state.searchInProgress = false;
          },
        },
      ] as unknown as Menu,
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // IPC listeners for search
  ipcMain.on("search-query", (event, query) => {
    if (state.searchInProgress && query) {
      win.webContents.findInPage(query);
    }
  });

  ipcMain.on("close-search", () => {
    removeSearchPopup();
    win.webContents.stopFindInPage("clearSelection");
  });

}
