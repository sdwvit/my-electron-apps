import { BrowserWindow, Notification, session, shell } from "electron";

/** Taskbar progress and a "done" notification for every download. */
export const setupDownloads = () => {
  session.defaultSession.on("will-download", (_event, item, webContents) => {
    const win = BrowserWindow.fromWebContents(webContents);
    item.on("updated", () => {
      const total = item.getTotalBytes();
      if (win && !win.isDestroyed()) {
        win.setProgressBar(total ? item.getReceivedBytes() / total : 2);
      }
    });
    item.once("done", (_e, state) => {
      if (win && !win.isDestroyed()) {
        win.setProgressBar(-1);
      }
      if (state === "cancelled" || !Notification.isSupported()) {
        return;
      }
      const name = item.getFilename();
      const notification = new Notification(
        state === "completed"
          ? { title: "Download complete", body: `${name} — click to show` }
          : { title: "Download failed", body: name },
      );
      if (state === "completed") {
        notification.on("click", () =>
          shell.showItemInFolder(item.getSavePath()),
        );
      }
      notification.show();
    });
  });
};
