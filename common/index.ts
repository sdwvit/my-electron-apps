import { app, BrowserWindow, Menu, Tray, nativeImage } from "electron";
import { createWindow } from "./createWindow";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

export function commonAppLifecycle(
  address: string,
  customItems: any[],
  userAgent?: string,
  trayOptions?: {
    iconFile?: string;
    iconPath?: string;
    tooltip: string;
    showLabel?: string;
    hideLabel?: string;
    quitLabel?: string;
    badgeFromTitle?: boolean;
    badgeScript?: string;
    badgeIntervalMs?: number;
  },
) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return Promise.resolve(undefined);
  }

  dotenv.config();
  const userDataPath = process.env.CHROMIUM_USER_DATA_PATH;
  if (userDataPath) {
    app.setPath("userData", userDataPath);
  }

  let currentWin: BrowserWindow | undefined;
  let tray: Tray | undefined;
  let isQuitting = false;
  let trayBaseImage: Electron.NativeImage | undefined;
  let trayBaseDataUrl: string | undefined;
  let lastBadgeCount: number | undefined;
  let badgeRenderToken = 0;
  let badgeRendererPromise: Promise<BrowserWindow> | undefined;
  let badgeIntervalId: NodeJS.Timeout | undefined;

  const getBadgeRenderer = () => {
    if (!badgeRendererPromise) {
      badgeRendererPromise = (async () => {
        const win = new BrowserWindow({
          show: false,
          width: 64,
          height: 64,
          webPreferences: {
            offscreen: true,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        });
        await win.loadURL("about:blank");
        return win;
      })();
    }
    return badgeRendererPromise;
  };

  const renderBadgePng = async (baseDataUrl: string, count: number) => {
    const win = await getBadgeRenderer();
    const text = count > 99 ? "99+" : String(count);
    const fontSize = text.length > 2 ? 16 : 20;
    const dataUrl = await win.webContents.executeJavaScript(
      `
        (async () => {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.src = ${JSON.stringify(baseDataUrl)};
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          ctx.drawImage(img, 0, 0, 64, 64);
          if (${count} > 0) {
            ctx.beginPath();
            ctx.fillStyle = '#E53935';
            ctx.arc(48, 16, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '700 ${fontSize}px Sans-Serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(${JSON.stringify(text)}, 48, 16);
          }
          return canvas.toDataURL('image/png');
        })();
      `,
      true,
    );
    return nativeImage.createFromDataURL(dataUrl);
  };

  const setTrayBadge = async (count: number) => {
    if (!tray || !trayBaseImage || !trayBaseDataUrl) {
      return;
    }
    const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
    if (lastBadgeCount === safeCount) {
      return;
    }
    lastBadgeCount = safeCount;
    if (safeCount === 0) {
      tray.setImage(trayBaseImage);
      return;
    }
    const token = ++badgeRenderToken;
    try {
      const badgeImage = await renderBadgePng(trayBaseDataUrl, safeCount);
      if (token !== badgeRenderToken || badgeImage.isEmpty()) {
        return;
      }
      tray.setImage(badgeImage);
    } catch (error) {
      tray.setImage(trayBaseImage);
    }
  };

  const parseBadgeCount = (title: string) => {
    const parenMatch = /\((\d+)\)/.exec(title);
    if (parenMatch) {
      return Number(parenMatch[1]);
    }
    const leadingMatch = /^\s*(\d+)\b/.exec(title);
    if (leadingMatch) {
      return Number(leadingMatch[1]);
    }
    return 0;
  };

  const setupTray = (win: BrowserWindow) => {
    if (!trayOptions || tray) {
      return;
    }
    const iconPath =
      trayOptions.iconPath ||
      (trayOptions.iconFile
        ? path.join(app.getAppPath(), trayOptions.iconFile)
        : undefined);
    if (!iconPath) {
      return;
    }
    try {
      const iconBuffer = fs.readFileSync(iconPath);
      const extension = path.extname(iconPath).toLowerCase();
      const mimeType = extension === ".svg" ? "image/svg+xml" : "image/png";
      trayBaseDataUrl = `data:${mimeType};base64,${iconBuffer.toString("base64")}`;
      trayBaseImage = nativeImage.createFromDataURL(trayBaseDataUrl);
    } catch (error) {
      trayBaseImage = undefined;
      trayBaseDataUrl = undefined;
    }
    if (!trayBaseImage || trayBaseImage.isEmpty()) {
      trayBaseImage = nativeImage.createFromPath(iconPath);
    }
    tray = new Tray(trayBaseImage);
    tray.setToolTip(trayOptions.tooltip);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: trayOptions.showLabel || "Show",
          click: () => {
            const target = currentWin;
            if (!target) {
              return;
            }
            target.show();
            target.focus();
          },
        },
        {
          label: trayOptions.hideLabel || "Hide",
          click: () => currentWin?.hide(),
        },
        {
          label: trayOptions.quitLabel || "Quit",
          click: () => app.quit(),
        },
      ]),
    );
    tray.on("click", () => {
      const target = currentWin;
      if (!target) {
        return;
      }
      if (target.isVisible()) {
        target.hide();
      } else {
        target.show();
        target.focus();
      }
    });
    app.on("before-quit", () => {
      isQuitting = true;
    });

    if (trayOptions.badgeFromTitle !== false && !trayOptions.badgeScript) {
      win.on("page-title-updated", (_event, title) => {
        void setTrayBadge(parseBadgeCount(title));
      });
    }

    if (trayOptions.badgeScript) {
      const intervalMs = trayOptions.badgeIntervalMs || 5000;
      const wrappedScript = `
        (() => {
          try {
            ${trayOptions.badgeScript}
          } catch (error) {
            return 0;
          }
        })();
      `;
      badgeIntervalId = setInterval(async () => {
        if (!currentWin || currentWin.isDestroyed()) {
          return;
        }
        try {
          const result = await currentWin.webContents.executeJavaScript(
            wrappedScript,
            true,
          );
          const count = Number.isFinite(result) ? Number(result) : 0;
          await setTrayBadge(count);
        } catch (error) {
          await setTrayBadge(0);
        }
      }, intervalMs);
      win.on("closed", () => {
        if (badgeIntervalId) {
          clearInterval(badgeIntervalId);
        }
      });
    }
  };

  const attachCloseToTray = (win: BrowserWindow) => {
    if (!trayOptions) {
      return;
    }
    win.on("close", (event) => {
      if (isQuitting) {
        return;
      }
      event.preventDefault();
      win.hide();
    });
  };

  // Start the app
  const winPr = app.whenReady().then(() => {
    currentWin = createWindow(address, customItems, userAgent);
    setupTray(currentWin);
    attachCloseToTray(currentWin);
    return currentWin;
  });

  app.on("second-instance", () => {
    if (!currentWin) {
      return;
    }
    if (currentWin.isMinimized()) {
      currentWin.restore();
    }
    currentWin.show();
    currentWin.focus();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      currentWin = createWindow(address, customItems, userAgent);
      setupTray(currentWin);
      attachCloseToTray(currentWin);
    }
  });
  return winPr;
}
