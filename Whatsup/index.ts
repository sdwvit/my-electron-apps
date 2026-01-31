import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};

  state.win = await commonAppLifecycle(
    address,
    [],
    "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
    {
      iconFile: "Whatsup.png",
      tooltip: "WhatsApp",
    },
  );
}

start("https://web.whatsapp.com/");
