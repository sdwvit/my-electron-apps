import { BrowserWindow, shell } from "electron";

export function handleExternalLinks(
  event: Electron.Event<{}>,
  url: string,
  win: BrowserWindow,
) {
  if (url !== win.webContents.getURL() && !/auth|sign_in|gitlab|account|chatgpt/.test(url)) {
    event.preventDefault();
    shell.openExternal(url);
  }
}
