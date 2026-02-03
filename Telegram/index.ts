import { BrowserWindow } from "electron";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { commonAppLifecycle } from "../common";

type Rgb = [number, number, number];

const clampByte = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)));

const parseRgb = (value: string | undefined | null): Rgb | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const hexMatch = /^#?([0-9a-f]{6})$/i.exec(trimmed);
  if (hexMatch) {
    const intValue = parseInt(hexMatch[1], 16);
    return [(intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255];
  }
  const rgbMatch = /(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/.exec(trimmed);
  if (!rgbMatch) {
    return null;
  }
  const [r, g, b] = rgbMatch.slice(1, 4).map((part) => clampByte(Number(part)));
  return [r, g, b];
};

const readKdeAccentColor = (): Rgb | null => {
  const envOverride =
    process.env.TELEGRAM_PRIMARY_COLOR || process.env.KDE_PRIMARY_COLOR;
  const envColor = parseRgb(envOverride);
  if (envColor) {
    return envColor;
  }

  try {
    const output = execFileSync("cat", ["~/.config/kdeglobals"])
      .toString()
      .trim()
      .split("\n")
      .find((l) => l.startsWith("AccentColor"));

    const color = parseRgb(output);
    if (color) {
      return color;
    }
  } catch (error) {
    // Ignore if kreadconfig5 is unavailable.
  }

  const kdeglobals = path.join(os.homedir(), ".config", "kdeglobals");
  if (!fs.existsSync(kdeglobals)) {
    return null;
  }
  try {
    const contents = fs.readFileSync(kdeglobals, "utf8");
    const accentLine = contents.match(/^\s*AccentColor\s*=\s*(.+)$/m)?.[1];
    const accentColor = parseRgb(accentLine);
    if (accentColor) {
      return accentColor;
    }
    const selectionMatch = contents.match(
      /^\s*BackgroundNormal\s*=\s*(.+)$/m,
    )?.[1];
    return parseRgb(selectionMatch);
  } catch (error) {
    return null;
  }
};

const buildTelegramPrimaryVars = (base: Rgb) => {
  const [r, g, b] = base;
  const shade = base.map((channel) => clampByte(channel * 0.88)) as Rgb;
  return {
    "--color-primary": `rgb(${r}, ${g}, ${b})`,
    "--color-primary-opacity": `rgba(${r}, ${g}, ${b}, 0.118)`,
    "--color-primary-opacity-hover": `rgba(${r}, ${g}, ${b}, 0.251)`,
    "--color-primary-tint": `rgba(${r}, ${g}, ${b}, 0.102)`,
    "--color-primary-shade": `rgb(${shade[0]}, ${shade[1]}, ${shade[2]})`,
    "--color-primary-shade-rgb": `${shade[0]},${shade[1]},${shade[2]}`,
  };
};

const applyTelegramPrimaryVars = (win: BrowserWindow, base: Rgb) => {
  const vars = buildTelegramPrimaryVars(base);
  const script = `
    (() => {
      const vars = ${JSON.stringify(vars)};
      const root = document.documentElement || document.body;
      if (!root) return;
      for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
      }
    })();
  `;
  void win.webContents.executeJavaScript(script, true);
};

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};
  const kdePrimaryColor = readKdeAccentColor();

  state.win = await commonAppLifecycle(address, [], undefined, {
    iconFile: "Telegram.png",
    tooltip: "Telegram",
    badgeFromTitle: false,
    badgeScript: `
      const numericFromText = (text) => {
        const value = parseInt(String(text || '').replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(value) ? value : 0;
      };
      const tab = [...document.querySelectorAll('.Tab_inner')]
        .find((el) => (el.textContent || '').trim().startsWith('All'));
      const badge = tab?.querySelector('.badge.Tab__badge--active');
      return numericFromText(badge?.textContent);
    `,
    badgeIntervalMs: 4000,
  });

  if (state.win && kdePrimaryColor) {
    const applyVars = () =>
      state.win && applyTelegramPrimaryVars(state.win, kdePrimaryColor);
    state.win.webContents.on("did-finish-load", applyVars);
    state.win.webContents.on("did-navigate-in-page", applyVars);
  }
}

start("https://web.telegram.org/a/");
