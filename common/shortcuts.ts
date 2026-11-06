import { BrowserWindow, WebContents } from "electron";
import { actions } from "./actions";

/**
 * Keyboard shortcuts, handled per window so they also work in popups.
 * The application menu only displays these accelerators.
 */
export const attachShortcuts = (win: BrowserWindow, wc: WebContents) => {
  wc.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") {
      return;
    }
    const ctrl = input.control || input.meta;
    const key = input.key.length === 1 ? input.key.toLowerCase() : input.key;
    const run = (fn: () => unknown) => {
      event.preventDefault();
      fn();
    };

    if (ctrl && !input.alt) {
      if (key === "+" || key === "=") return run(() => actions.zoomIn(wc));
      if (key === "-" || key === "_") return run(() => actions.zoomOut(wc));
      if (key === "0") return run(() => actions.resetZoom(wc));
      if (key === "f" && !input.shift) return run(() => actions.find(win));
      if (key === "g" && actions.isFindOpen(win))
        return run(() => actions.findNext(win, !input.shift));
      if (key === "r")
        return run(() =>
          (input.shift ? actions.hardReload : actions.reload)(wc),
        );
      if (key === "i" && input.shift) return run(() => actions.devTools(wc));
      return;
    }

    if (input.alt && !ctrl && !input.shift) {
      if (key === "ArrowLeft") return run(() => actions.back(wc));
      if (key === "ArrowRight") return run(() => actions.forward(wc));
      if (key === "Home") return run(() => actions.home(wc));
      return;
    }

    if (!ctrl && !input.alt) {
      if (key === "F5")
        return run(() =>
          (input.shift ? actions.hardReload : actions.reload)(wc),
        );
      if (key === "F12") return run(() => actions.devTools(wc));
      if (key === "F11") return run(() => actions.fullScreen(win));
      if (key === "F3" && actions.isFindOpen(win))
        return run(() => actions.findNext(win, !input.shift));
      if (key === "Escape" && actions.isFindOpen(win))
        return run(() => actions.closeFind(win));
    }
  });

  // Mouse back/forward buttons.
  win.on("app-command", (_event, command) => {
    if (command === "browser-backward") actions.back(wc);
    if (command === "browser-forward") actions.forward(wc);
  });
};
