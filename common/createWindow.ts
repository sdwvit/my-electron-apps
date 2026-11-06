import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
} from "electron";
import { getAppConfig } from "./config";
import { createContextMenu } from "./createContextMenu";
import { trackFindResults } from "./findBar";
import { handleExternalLinks } from "./handleExternalLinks";
import { attachShortcuts } from "./shortcuts";
import { displayUrl, isInternalUrl, isOffHome, openExternal } from "./urls";
import { restoredBounds, trackWindowState } from "./windowState";
import { trackZoom } from "./zoom";

const baseOptions: BrowserWindowConstructorOptions = {
  width: 1024,
  height: 800,
  frame: true,
  transparent: true,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    spellcheck: true,
  },
};

/**
 * Status bubble text: the hovered link, otherwise the page URL when it is on a
 * different site than the app's home page.
 */
const attachStatusBubble = (win: BrowserWindow) => {
  const wc = win.webContents;
  let hoverUrl = "";
  const update = () => {
    if (wc.isDestroyed()) {
      return;
    }
    const page = wc.getURL();
    const text = hoverUrl || (isOffHome(page) ? page : "");
    wc.send("qol:status", text ? displayUrl(text) : "");
  };
  wc.on("update-target-url", (_event, url) => {
    hoverUrl = url;
    update();
  });
  wc.on("did-navigate", update);
  wc.on("did-navigate-in-page", (_e, _url, isMainFrame) => {
    if (isMainFrame) update();
  });
  wc.on("dom-ready", update);
};

/** Everything a window needs, for app windows and page-opened popups alike. */
export const attachWindow = (win: BrowserWindow) => {
  const wc = win.webContents;
  const { userAgent } = getAppConfig();
  if (userAgent) {
    wc.setUserAgent(userAgent);
  }

  wc.on("will-navigate", (event, url) => handleExternalLinks(event, url, wc));

  wc.setWindowOpenHandler(({ url, disposition }) => {
    // about:blank popups are usually sign-in or print flows that need window.opener.
    if (url === "about:blank" || isInternalUrl(url)) {
      const isTab = disposition !== "new-window";
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          ...(isTab ? { width: 1024, height: 800 } : {}),
        },
      };
    }
    openExternal(url);
    return { action: "deny" };
  });
  wc.on("did-create-window", (child) => attachWindow(child));

  wc.on("context-menu", (_event, params) => {
    createContextMenu(wc, params, createWindow).popup({ window: win });
  });

  attachShortcuts(win, wc);
  attachStatusBubble(win);
  trackFindResults(win);
  trackZoom(wc);
};

export function createWindow(url?: string, options: { main?: boolean } = {}) {
  const { homeUrl, userAgent } = getAppConfig();
  const win = new BrowserWindow({
    ...baseOptions,
    ...(options.main ? restoredBounds() : {}),
  });
  if (options.main) {
    trackWindowState(win);
  }
  attachWindow(win);
  win.loadURL(url || homeUrl, { userAgent });
  return win;
}

/** IPC from the preload, shared by all windows. Call once. */
export const setupWindowIpc = () => {
  ipcMain.on("qol:open-new-window", (event) => {
    createWindow(event.sender.getURL());
  });
};
