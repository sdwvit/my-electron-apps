import { app, BrowserWindow } from "electron";
import { createWindow } from "./createWindow";

export function commonAppLifecycle(address: string, customItems: any[]) {
  // Start the app
  const winPr = app.whenReady().then(() => createWindow(address, customItems));

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(address, customItems);
    }
  });
  return winPr;
}
