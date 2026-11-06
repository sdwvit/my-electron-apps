import { BrowserWindow, ipcMain, WebContentsView } from "electron";

const WIDTH = 380;
const HEIGHT = 44;
const MARGIN = 12;

type FindBar = { view: WebContentsView; query: string; onResize: () => void };

const bars = new Map<BrowserWindow, FindBar>();

const barHtml = () =>
  "data:text/html;charset=UTF-8," +
  encodeURIComponent(`<!DOCTYPE html>
<html><head><style>
  :root { color-scheme: light dark; --bg: #fff; --fg: #202124; --muted: #5f6368; --border: #dadce0; --hover: #f1f3f4; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #2b2c2f; --fg: #e8eaed; --muted: #9aa0a6; --border: #3c4043; --hover: #3c4043; }
  }
  html, body { margin: 0; height: 100%; background: transparent; overflow: hidden; }
  body { font: 13px system-ui, sans-serif; color: var(--fg); }
  .bar { box-sizing: border-box; height: 100%; display: flex; align-items: center; gap: 4px;
         padding: 0 6px 0 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; }
  input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; }
  .count { color: var(--muted); font-variant-numeric: tabular-nums; min-width: 48px; text-align: right; padding-right: 4px; }
  .count.none { color: #d93025; }
  button { border: 0; background: transparent; color: var(--muted); width: 28px; height: 28px;
           border-radius: 50%; font-size: 15px; cursor: pointer; }
  button:hover { background: var(--hover); color: var(--fg); }
</style></head><body>
  <div class="bar">
    <input id="q" type="text" placeholder="Find in page" autofocus spellcheck="false" />
    <span id="count" class="count"></span>
    <button id="prev" title="Previous (Shift+Enter)">&#8593;</button>
    <button id="next" title="Next (Enter)">&#8595;</button>
    <button id="close" title="Close (Esc)">&#10005;</button>
  </div>
<script>
  const { ipcRenderer } = require('electron');
  const q = document.getElementById('q');
  const count = document.getElementById('count');
  const send = (forward, findNext) => ipcRenderer.send('find:query', { text: q.value, forward, findNext });
  q.addEventListener('input', () => send(true, true));
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); send(!e.shiftKey, false); }
    if (e.key === 'Escape') { e.preventDefault(); ipcRenderer.send('find:close'); }
  });
  document.getElementById('prev').onclick = () => { send(false, false); q.focus(); };
  document.getElementById('next').onclick = () => { send(true, false); q.focus(); };
  document.getElementById('close').onclick = () => ipcRenderer.send('find:close');
  ipcRenderer.on('find:focus', () => { q.focus(); q.select(); });
  ipcRenderer.on('find:result', (_e, r) => {
    count.textContent = q.value ? (r.matches ? r.active + '/' + r.matches : '0/0') : '';
    count.classList.toggle('none', !!q.value && !r.matches);
  });
</script></body></html>`);

const ownerOf = (sender: Electron.WebContents) => {
  for (const [win, bar] of bars) {
    if (bar.view.webContents === sender) {
      return win;
    }
  }
  return undefined;
};

const layout = (win: BrowserWindow, view: WebContentsView) => {
  const [width] = win.getContentSize();
  const barWidth = Math.min(WIDTH, width - MARGIN * 2);
  view.setBounds({
    x: width - barWidth - MARGIN,
    y: MARGIN,
    width: barWidth,
    height: HEIGHT,
  });
};

export const isFindOpen = (win: BrowserWindow) => bars.has(win);

export const openFind = (win: BrowserWindow) => {
  const existing = bars.get(win);
  if (existing) {
    existing.view.webContents.focus();
    existing.view.webContents.send("find:focus");
    return;
  }
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });
  view.setBackgroundColor("#00000000");
  const onResize = () => layout(win, view);
  bars.set(win, { view, query: "", onResize });
  win.contentView.addChildView(view);
  layout(win, view);
  win.on("resize", onResize);
  view.webContents.loadURL(barHtml());
  view.webContents.once("dom-ready", () => view.webContents.focus());
};

export const closeFind = (win: BrowserWindow) => {
  const bar = bars.get(win);
  if (!bar) {
    return;
  }
  bars.delete(win);
  win.removeListener("resize", bar.onResize);
  if (!win.isDestroyed()) {
    win.contentView.removeChildView(bar.view);
    win.webContents.stopFindInPage("keepSelection");
    win.webContents.focus();
  }
  bar.view.webContents.close();
};

export const findNext = (win: BrowserWindow, forward: boolean) => {
  const bar = bars.get(win);
  if (bar?.query) {
    win.webContents.findInPage(bar.query, { forward, findNext: false });
  }
};

/** Registers the IPC handlers shared by every find bar. Call once. */
export const setupFindBar = () => {
  ipcMain.on("find:query", (event, { text, forward, findNext: isNew }) => {
    const win = ownerOf(event.sender);
    const bar = win && bars.get(win);
    if (!win || !bar) {
      return;
    }
    bar.query = String(text || "");
    if (!bar.query) {
      win.webContents.stopFindInPage("clearSelection");
      event.sender.send("find:result", { active: 0, matches: 0 });
      return;
    }
    win.webContents.findInPage(bar.query, {
      forward: forward !== false,
      findNext: !!isNew,
    });
  });
  ipcMain.on("find:close", (event) => {
    const win = ownerOf(event.sender);
    if (win) {
      closeFind(win);
    }
  });
};

/** Forwards match counts from a window's page to its find bar. */
export const trackFindResults = (win: BrowserWindow) => {
  win.webContents.on("found-in-page", (_event, result) => {
    bars.get(win)?.view.webContents.send("find:result", {
      active: result.activeMatchOrdinal,
      matches: result.matches,
    });
  });
  win.on("closed", () => closeFind(win));
};
