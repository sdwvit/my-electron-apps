import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};

  state.win = await commonAppLifecycle(address, []);
}

start(
  "https://console.cloud.google.com/logs/query;duration=PT30M?project=noibu-unicron",
);
