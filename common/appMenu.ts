import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  WebContents,
} from "electron";
import { actions } from "./actions";

const focused = () => BrowserWindow.getFocusedWindow() ?? undefined;

const item = (
  label: string,
  accelerator: string | undefined,
  run: (win: BrowserWindow, wc: WebContents) => unknown,
): MenuItemConstructorOptions => ({
  label,
  accelerator,
  // Shortcuts are handled in shortcuts.ts so they work in every window; the menu
  // only shows them. Registering them here as well would fire them twice.
  registerAccelerator: false,
  click: () => {
    const win = focused();
    if (win) run(win, win.webContents);
  },
});

const role = (
  r: MenuItemConstructorOptions["role"],
): MenuItemConstructorOptions => ({ role: r, registerAccelerator: false });

export const setupAppMenu = () => {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "&Edit",
        submenu: [
          role("undo"),
          role("redo"),
          { type: "separator" },
          role("cut"),
          role("copy"),
          role("paste"),
          { ...role("pasteAndMatchStyle"), label: "Paste as Plain Text" },
          role("selectAll"),
          { type: "separator" },
          item("Find…", "CmdOrCtrl+F", (win) => actions.find(win)),
          item("Find Next", "F3", (win) => actions.findNext(win, true)),
          item("Find Previous", "Shift+F3", (win) =>
            actions.findNext(win, false),
          ),
        ],
      },
      {
        label: "&View",
        submenu: [
          item("Reload", "CmdOrCtrl+R", (_w, wc) => actions.reload(wc)),
          item("Hard Reload", "CmdOrCtrl+Shift+R", (_w, wc) =>
            actions.hardReload(wc),
          ),
          { type: "separator" },
          item("Zoom In", "CmdOrCtrl+=", (_w, wc) => actions.zoomIn(wc)),
          item("Zoom Out", "CmdOrCtrl+-", (_w, wc) => actions.zoomOut(wc)),
          item("Actual Size", "CmdOrCtrl+0", (_w, wc) => actions.resetZoom(wc)),
          { type: "separator" },
          item("Full Screen", "F11", (win) => actions.fullScreen(win)),
          item("Developer Tools", "F12", (_w, wc) => actions.devTools(wc)),
        ],
      },
      {
        label: "&Go",
        submenu: [
          item("Back", "Alt+Left", (_w, wc) => actions.back(wc)),
          item("Forward", "Alt+Right", (_w, wc) => actions.forward(wc)),
          item("Home Page", "Alt+Home", (_w, wc) => actions.home(wc)),
          { type: "separator" },
          item("Copy Page Address", undefined, (_w, wc) =>
            actions.copyAddress(wc),
          ),
          item("Open Page in Browser", undefined, (_w, wc) =>
            actions.openInBrowser(wc),
          ),
        ],
      },
    ]),
  );
};
