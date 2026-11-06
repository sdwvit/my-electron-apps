import { WebContents } from "electron";
import { isInternalUrl, openExternal } from "./urls";

export function handleExternalLinks(
  event: Electron.Event<{}>,
  url: string,
  webContents: WebContents,
) {
  if (url === webContents.getURL() || isInternalUrl(url)) {
    return;
  }
  event.preventDefault();
  openExternal(url);
}
