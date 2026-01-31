import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};
  const customItems = [
    {
      label: "Generate MR Name",
      click: () =>
        state.win?.webContents.executeJavaScript(
          `(${generateScript().toString()})()`,
        ),
    },
  ].filter(Boolean);
  state.win = await commonAppLifecycle(address, customItems, undefined, {
    iconFile: "Linear.svg",
    tooltip: "Linear",
  });

  function generateScript() {
    return () => {
      const types = ["fix", "feature", "maintenance", "chore"];
      const sanitize = (str: string) =>
        str.replace(/[^\w]/g, "-").replace(/-+/g, "-");
      const allSpans = [...document.querySelectorAll("span")];
      const spanWithLabel = allSpans.filter((e) =>
        e.innerText.includes("Labels"),
      )[0];
      const parentSpans = [
        ...spanWithLabel.parentNode!.parentNode!.querySelectorAll("span"),
      ];
      const spanThatsNotLabel = parentSpans.filter(
        (e) => !/(cycle|labels)/i.test(e.innerText) && !!e.innerText,
      );
      if (!spanThatsNotLabel.length) {
        window.alert("Add at least 1 label");
        return;
      }
      const type =
        spanThatsNotLabel
          .filter((e) => types.includes(e.innerText.toLowerCase()))
          .pop()?.innerText || "fix";
      const domain = spanThatsNotLabel
        .filter((e) => !types.includes(e.innerText.toLowerCase()))
        .pop()?.innerText;

      if (!domain) {
        window.alert("Needs a project domain in labels");
        return;
      }

      const explanation = sanitize(
        document.querySelectorAll<HTMLDivElement>('*[aria-label*="title"]')[0]
          .innerText,
      );

      const ticketCode = /ISS-\d+/g.exec(
        document.querySelector('[aria-label="Issue options"]')!.parentElement!
          .parentElement!.innerText,
      )![0];
      const result =
        `sdwvit/${type}/${domain}/${explanation}/${ticketCode}`.toLocaleLowerCase();
      navigator.clipboard.writeText(result);
      window.alert(result);
    };
  }
}

start("https://linear.app/noibu/view/82306b88-3942-4cef-88d8-6d130d4c012a");
