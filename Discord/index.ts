import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};

  state.win = await commonAppLifecycle(address, [], undefined, {
    iconFile: "Discord.png",
    tooltip: "Discord",
    badgeFromTitle: false,
    badgeScript: `
      const numericFromText = (text) => {
        const value = parseInt(String(text || '').replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(value) ? value : 0;
      };
      const rootStyles = getComputedStyle(document.documentElement);
      const badgeVar = rootStyles.getPropertyValue('--badge-notification-background').trim();
      const badgeColor = badgeVar
        ? (() => {
            const temp = document.createElement('div');
            temp.style.backgroundColor = badgeVar;
            document.body.appendChild(temp);
            const color = getComputedStyle(temp).backgroundColor;
            temp.remove();
            return color;
          })()
        : '';
      const sidebar = document.querySelector('[aria-label="Servers sidebar"]');
      const candidates = sidebar
        ? [
            ...sidebar.querySelectorAll('[style*="badge-notification-background"]'),
            ...sidebar.querySelectorAll('[class*="badge" i]'),
          ]
        : [];
      const values = candidates
        .filter((node) => {
          const color = getComputedStyle(node).backgroundColor;
          return badgeColor ? color === badgeColor : true;
        })
        .map((node) => numericFromText(node.textContent))
        .filter((value) => value > 0);
      if (values.length) {
        return values.reduce((sum, value) => sum + value, 0);
      }
      const fallbackNodes = sidebar
        ? [...sidebar.querySelectorAll('.numberBadge__2b1f5')]
        : [];
      return fallbackNodes
        .map((node) => numericFromText(node.textContent))
        .filter((value) => value > 0)
        .reduce((sum, value) => sum + value, 0);
    `,
    badgeIntervalMs: 4000,
  });
}

start("https://discord.com/app");
