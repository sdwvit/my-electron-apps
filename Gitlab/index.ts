import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

async function start(address: string) {
  const state: { win?: BrowserWindow } = {};
  const customItems = [
    {
      label: "Fill MR Name",
      click: () =>
        state.win?.webContents.executeJavaScript(
          `(${generateMRScript().toString()})()`,
        ),
    },
  ].filter(Boolean);
  state.win = await commonAppLifecycle(address, customItems);

  function generateMRScript() {
    return () => {
      const outputSelector = "[data-testid=issuable-form-title-field]";
      const submitSelector = "[data-track-label=submit_mr]";
      const bodySelector = "[data-testid=issuable-form-description-field]";
      const input: HTMLInputElement = document.querySelector(
        ".branch-selector code",
      )!;
      const output: HTMLInputElement = document.querySelector(outputSelector)!;
      const issueBody: HTMLInputElement = document.querySelector(bodySelector)!;
      const saveButton: HTMLButtonElement =
        document.querySelector(submitSelector)!;

      let [user, type, domain, explanation, ticket] =
        input.innerText.split("/");
      explanation = explanation.replaceAll("-", " ");
      ticket = ticket.toUpperCase();
      type = type[0].toUpperCase() + type.slice(1);
      output.value = `${type}(${domain}): ${explanation}`;
      issueBody.value = issueBody.value.replace(
        /Fixes LINEAR_ISSUE_ID/gi,
        `Fixes ${ticket}`,
      );
      saveButton?.click();
    };
  }
}

start(
  "https://gitlab.com/noibu/unicron/-/merge_requests?scope=all&state=opened&author_username=sdwvit.noibu",
);
