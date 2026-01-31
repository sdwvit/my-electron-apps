import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};

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
}

start("https://web.telegram.org/a/");
