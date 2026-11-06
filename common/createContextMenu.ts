import {
  BrowserWindow,
  clipboard,
  ContextMenuParams,
  Menu,
  MenuItemConstructorOptions,
  WebContents,
} from "electron";
import { getAppConfig } from "./config";
import { isWebUrl, openExternal } from "./urls";

const truncate = (text: string, max = 32) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

export function createContextMenu(
  webContents: WebContents,
  params: ContextMenuParams,
  createWindow: (url: string) => BrowserWindow,
) {
  const { homeUrl, customItems } = getAppConfig();
  const nav = webContents.navigationHistory;
  const flags = params.editFlags;
  const pageUrl = webContents.getURL();
  const selection = params.selectionText.trim();
  const sections: MenuItemConstructorOptions[][] = [];

  if (params.misspelledWord) {
    const suggestions = params.dictionarySuggestions.slice(0, 5);
    sections.push([
      ...(suggestions.length
        ? suggestions.map((word) => ({
            label: word,
            click: () => webContents.replaceMisspelling(word),
          }))
        : [{ label: "No suggestions", enabled: false }]),
      {
        label: "Add to Dictionary",
        click: () =>
          webContents.session.addWordToSpellCheckerDictionary(
            params.misspelledWord,
          ),
      },
    ]);
  }

  if (params.linkURL) {
    const link = params.linkURL;
    sections.push(
      [
        isWebUrl(link) && {
          label: "Open Link in New Window",
          click: () => createWindow(link),
        },
        { label: "Open Link in Browser", click: () => openExternal(link) },
        {
          label: "Copy Link Address",
          click: () => clipboard.writeText(link),
        },
        params.linkText.trim() && {
          label: "Copy Link Text",
          click: () => clipboard.writeText(params.linkText.trim()),
        },
      ].filter(Boolean) as MenuItemConstructorOptions[],
    );
  }

  const src = params.srcURL;
  if (params.mediaType === "image" && src) {
    sections.push(
      [
        { label: "Save Image As…", click: () => webContents.downloadURL(src) },
        {
          label: "Copy Image",
          click: () => webContents.copyImageAt(params.x, params.y),
        },
        !src.startsWith("data:") && {
          label: "Copy Image Address",
          click: () => clipboard.writeText(src),
        },
        isWebUrl(src) && {
          label: "Open Image in Browser",
          click: () => openExternal(src),
        },
      ].filter(Boolean) as MenuItemConstructorOptions[],
    );
  } else if (
    (params.mediaType === "video" || params.mediaType === "audio") &&
    src
  ) {
    const kind = params.mediaType === "video" ? "Video" : "Audio";
    sections.push(
      [
        {
          label: `Save ${kind} As…`,
          click: () => webContents.downloadURL(src),
        },
        isWebUrl(src) && {
          label: `Copy ${kind} Address`,
          click: () => clipboard.writeText(src),
        },
        isWebUrl(src) && {
          label: `Open ${kind} in Browser`,
          click: () => openExternal(src),
        },
      ].filter(Boolean) as MenuItemConstructorOptions[],
    );
  }

  if (params.isEditable) {
    sections.push([
      { role: "undo", enabled: flags.canUndo },
      { role: "redo", enabled: flags.canRedo },
      { type: "separator" },
      { role: "cut", enabled: flags.canCut },
      { role: "copy", enabled: flags.canCopy },
      { role: "paste", enabled: flags.canPaste },
      {
        role: "pasteAndMatchStyle",
        label: "Paste as Plain Text",
        enabled: flags.canPaste,
      },
      { role: "selectAll", enabled: flags.canSelectAll },
    ]);
  } else if (selection) {
    sections.push([
      { role: "copy" },
      {
        label: `Search Google for “${truncate(selection)}”`,
        click: () =>
          openExternal(
            `https://www.google.com/search?q=${encodeURIComponent(selection)}`,
          ),
      },
    ]);
  }

  sections.push([
    {
      label: "Back",
      enabled: nav.canGoBack(),
      click: () => nav.goBack(),
    },
    {
      label: "Forward",
      enabled: nav.canGoForward(),
      click: () => nav.goForward(),
    },
    { label: "Reload", click: () => webContents.reload() },
    { label: "Home Page", click: () => webContents.loadURL(homeUrl) },
  ]);

  sections.push(
    [
      { label: "Duplicate Window", click: () => createWindow(pageUrl) },
      isWebUrl(pageUrl) && {
        label: "Open Page in Browser",
        click: () => openExternal(pageUrl),
      },
      {
        label: "Copy Page Address",
        click: () => clipboard.writeText(pageUrl),
      },
    ].filter(Boolean) as MenuItemConstructorOptions[],
  );

  if (customItems.length) {
    sections.push(customItems);
  }

  sections.push([
    {
      label: "Inspect Element",
      click: () => {
        webContents.inspectElement(params.x, params.y);
        if (webContents.isDevToolsOpened()) {
          webContents.devToolsWebContents?.focus();
        }
      },
    },
  ]);

  const template = sections
    .filter((section) => section.length)
    .flatMap((section, index) =>
      index === 0 ? section : [{ type: "separator" as const }, ...section],
    );
  return Menu.buildFromTemplate(template);
}
