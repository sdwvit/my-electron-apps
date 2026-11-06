import { BrowserWindow, clipboard, WebContents } from "electron";
import { getAppConfig } from "./config";
import { closeFind, findNext, isFindOpen, openFind } from "./findBar";
import { isWebUrl, openExternal } from "./urls";
import { resetZoom, zoomIn, zoomOut } from "./zoom";

/** Commands shared by keyboard shortcuts and the application menu. */
export const actions = {
  back: (wc: WebContents) => wc.navigationHistory.goBack(),
  forward: (wc: WebContents) => wc.navigationHistory.goForward(),
  home: (wc: WebContents) => wc.loadURL(getAppConfig().homeUrl),
  reload: (wc: WebContents) => wc.reload(),
  hardReload: (wc: WebContents) => wc.reloadIgnoringCache(),
  zoomIn,
  zoomOut,
  resetZoom,
  devTools: (wc: WebContents) => wc.toggleDevTools(),
  copyAddress: (wc: WebContents) => clipboard.writeText(wc.getURL()),
  openInBrowser: (wc: WebContents) =>
    isWebUrl(wc.getURL()) && openExternal(wc.getURL()),
  fullScreen: (win: BrowserWindow) => win.setFullScreen(!win.isFullScreen()),
  find: openFind,
  findNext,
  closeFind,
  isFindOpen,
};
