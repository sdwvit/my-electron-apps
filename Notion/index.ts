import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};

  state.win = await commonAppLifecycle(address, [], undefined, {
    iconFile: "Notion.svg",
    tooltip: "Notion",
  });
}

start("https://www.notion.so/");
