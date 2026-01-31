import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};

  state.win = await commonAppLifecycle(address, [], undefined, {
    iconFile: "ChatGPT.svg",
    tooltip: "ChatGPT",
  });
}

start("https://chatgpt.com/");
