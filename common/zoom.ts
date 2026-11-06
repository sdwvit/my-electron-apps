import { WebContents } from "electron";
import { loadWindowState, saveWindowState } from "./windowState";

const MIN = 0.25;
const MAX = 3;
const STEP = 0.1;

const clamp = (value: number) =>
  Math.round(Math.min(MAX, Math.max(MIN, value)) * 100) / 100;

export const setZoom = (webContents: WebContents, factor: number) => {
  const next = clamp(factor);
  webContents.setZoomFactor(next);
  saveWindowState({ zoomFactor: next });
};

export const zoomIn = (webContents: WebContents) =>
  setZoom(webContents, webContents.getZoomFactor() + STEP);

export const zoomOut = (webContents: WebContents) =>
  setZoom(webContents, webContents.getZoomFactor() - STEP);

export const resetZoom = (webContents: WebContents) => setZoom(webContents, 1);

/** Re-applies the saved zoom after navigations and handles Ctrl+wheel zoom. */
export const trackZoom = (webContents: WebContents) => {
  const apply = () => {
    const saved = loadWindowState().zoomFactor;
    if (saved && webContents.getZoomFactor() !== saved) {
      webContents.setZoomFactor(saved);
    }
  };
  webContents.on("did-navigate", apply);
  webContents.on("zoom-changed", (_event, direction) =>
    direction === "in" ? zoomIn(webContents) : zoomOut(webContents),
  );
};
