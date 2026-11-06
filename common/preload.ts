// Runs in every http(s) page of the app (registered with session.registerPreloadScript).
// Sandboxed: only `electron` can be required here.
import { ipcRenderer } from "electron";

const HOST_TAG = "electron-app-status";

if (window.top === window) {
  let text = "";
  let onRight = false;
  let host: HTMLElement | undefined;
  let label: HTMLSpanElement | undefined;

  const dark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Built with CSSOM instead of <style>/innerHTML so strict CSP and Trusted Types
  // pages (Gmail, Discord) do not block it; the shadow root keeps page CSS out.
  const ensure = () => {
    if (host?.isConnected && label) {
      return label;
    }
    if (!document.documentElement) {
      return undefined;
    }
    host = document.createElement(HOST_TAG);
    const hostStyle = host.style;
    hostStyle.setProperty("all", "initial", "important");
    hostStyle.setProperty("position", "fixed", "important");
    hostStyle.setProperty("bottom", "0", "important");
    hostStyle.setProperty("z-index", "2147483647", "important");
    hostStyle.setProperty("pointer-events", "none", "important");
    const root = host.attachShadow({ mode: "closed" });
    label = document.createElement("span");
    Object.assign(label.style, {
      display: "block",
      maxWidth: "60vw",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      boxSizing: "border-box",
      padding: "3px 8px",
      font: "12px/16px system-ui, sans-serif",
      letterSpacing: "normal",
      borderStyle: "solid",
      borderWidth: "1px",
    });
    root.appendChild(label);
    document.documentElement.appendChild(host);
    return label;
  };

  const render = () => {
    const el = ensure();
    if (!el || !host) {
      return;
    }
    if (!text) {
      host.style.setProperty("display", "none", "important");
      return;
    }
    const isDark = dark();
    el.textContent = text;
    el.style.color = isDark ? "#e8eaed" : "#202124";
    el.style.background = isDark ? "#2b2c2f" : "#f1f3f4";
    el.style.borderColor = isDark ? "#3c4043" : "#dadce0";
    el.style.borderRadius = onRight ? "6px 0 0 0" : "0 6px 0 0";
    el.style.borderLeftWidth = onRight ? "1px" : "0";
    el.style.borderRightWidth = onRight ? "0" : "1px";
    el.style.borderBottomWidth = "0";
    host.style.setProperty("display", "block", "important");
    host.style.setProperty("left", onRight ? "auto" : "0", "important");
    host.style.setProperty("right", onRight ? "0" : "auto", "important");
  };

  ipcRenderer.on("qol:status", (_event, next: string) => {
    text = next || "";
    render();
  });

  // Like Chrome's status bubble: move out of the way of the pointer.
  document.addEventListener(
    "mousemove",
    (event) => {
      if (!text || !label) {
        return;
      }
      const rect = label.getBoundingClientRect();
      const near =
        event.clientY > rect.top - 24 &&
        event.clientX > rect.left - 24 &&
        event.clientX < rect.right + 24;
      // Pick the side away from the pointer (not a toggle, which would flicker
      // when both positions overlap in a narrow window).
      const wantRight = event.clientX < window.innerWidth / 2;
      if (near && wantRight !== onRight) {
        onRight = wantRight;
        render();
      }
    },
    { passive: true },
  );

  document.addEventListener("DOMContentLoaded", render);

  // Middle-click on empty page space opens the current page in a new window.
  // Links are handled by the window-open handler; editable fields keep paste.
  window.addEventListener("auxclick", (event) => {
    if (event.button !== 1) {
      return;
    }
    const target = event.target as Element | null;
    if (
      target?.closest?.("a[href], input, textarea, [contenteditable]") ||
      (target as HTMLElement | null)?.isContentEditable
    ) {
      return;
    }
    ipcRenderer.send("qol:open-new-window");
  });
}
