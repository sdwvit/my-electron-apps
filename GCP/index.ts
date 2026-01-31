import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};

  state.win = await commonAppLifecycle(address, [], undefined, {
    iconFile: "GCP.svg",
    tooltip: "GCP Logs",
  });
}

start(
  "https://console.cloud.google.com/logs/query;duration=PT30M?project=noibu-unicron",
);
