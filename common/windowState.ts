import { app, BrowserWindow, Rectangle, screen } from "electron";
import fs from "fs";
import path from "path";

type WindowState = {
  bounds?: Rectangle;
  maximized?: boolean;
  zoomFactor?: number;
};

let cache: WindowState | undefined;

const statePath = () => path.join(app.getPath("userData"), "window-state.json");

export const loadWindowState = (): WindowState => {
  if (!cache) {
    try {
      cache = JSON.parse(fs.readFileSync(statePath(), "utf8"));
    } catch {
      cache = {};
    }
  }
  return cache!;
};

export const saveWindowState = (patch: Partial<WindowState>) => {
  cache = { ...loadWindowState(), ...patch };
  try {
    fs.mkdirSync(path.dirname(statePath()), { recursive: true });
    fs.writeFileSync(statePath(), JSON.stringify(cache));
  } catch {
    // Not worth crashing over.
  }
};

/** Saved bounds, if they are still visible on one of the connected displays. */
export const restoredBounds = (): Partial<Rectangle> => {
  const { bounds } = loadWindowState();
  if (!bounds) {
    return {};
  }
  const visible = screen.getAllDisplays().some(({ workArea: a }) => {
    return (
      bounds.x < a.x + a.width &&
      bounds.x + bounds.width > a.x &&
      bounds.y < a.y + a.height &&
      bounds.y + bounds.height > a.y
    );
  });
  return visible ? bounds : { width: bounds.width, height: bounds.height };
};

export const trackWindowState = (win: BrowserWindow) => {
  if (loadWindowState().maximized) {
    win.maximize();
  }
  let timer: NodeJS.Timeout | undefined;
  const save = () => {
    clearTimeout(timer);
    if (win.isDestroyed()) {
      return;
    }
    saveWindowState({
      bounds: win.getNormalBounds(),
      maximized: win.isMaximized(),
    });
  };
  const saveSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(save, 500);
  };
  win.on("resize", saveSoon);
  win.on("move", saveSoon);
  win.on("maximize", save);
  win.on("unmaximize", save);
  win.on("close", save);
};
