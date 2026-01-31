import { app, BrowserWindow } from "electron";
import { createWindow } from "./createWindow";
import dotenv from "dotenv";

export function commonAppLifecycle(
  address: string,
  customItems: any[],
  userAgent?: string,
) {
  dotenv.config();
  const userDataPath = process.env.CHROMIUM_USER_DATA_PATH;
  if (userDataPath) {
    app.setPath("userData", userDataPath);
  }

  // Start the app
  const winPr = app
    .whenReady()
    .then(() => createWindow(address, customItems, userAgent));

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
