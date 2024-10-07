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
  state.win = await commonAppLifecycle(address, customItems);

  function generateScript() {
    return () => {
      const type = "fix";
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
        (e) => !/(cycle|labels)/i.test(e.innerText),
      )[0];
      if (!spanThatsNotLabel) {
        window.alert("Add at least 1 label");
        return;
      }
      const domain = sanitize(spanThatsNotLabel.innerText);
      const explanation = sanitize(
        document.querySelectorAll<HTMLDivElement>('*[aria-label*="title"]')[0]
          .innerText,
      );

      const ticketCode = /NOI-\d+/g.exec(
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

start("https://linear.app/");