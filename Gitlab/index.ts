import { BrowserWindow } from "electron";
import { commonAppLifecycle } from "../common";

type Maybe<A> = A | null;

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
    return async () => {
      const outputSelector = "[data-testid=issuable-form-title-field]";
      const submitSelector = "[data-track-label=submit_mr]";
      const bodySelector = "[data-testid=issuable-form-description-field]";
      const assignMeSelector = ".assign-to-me-link";
      const reviewersSelector = ".js-reviewer-search";
      const reviewersIds = [13096912, 11109949];
      const reviewerSelector = (id: number) => `li[data-user-id="${id}"] > a`;
      const input: Maybe<HTMLInputElement> = document.querySelector(
        ".branch-selector code",
      );
      const output: Maybe<HTMLInputElement> =
        document.querySelector(outputSelector);
      const issueBody: Maybe<HTMLInputElement> =
        document.querySelector(bodySelector);
      const saveButton: Maybe<HTMLButtonElement> =
        document.querySelector(submitSelector);
      const assignMeButton: Maybe<HTMLButtonElement> =
        document.querySelector(assignMeSelector);
      const reviewersInput: Maybe<HTMLButtonElement> =
        document.querySelector(reviewersSelector);
      let [_user, type, domain, explanation, ticket] =
        input?.innerText?.split?.("/") || [];
      explanation = explanation.replaceAll("-", " ");
      ticket = ticket.toUpperCase();
      type = type[0].toUpperCase() + type.slice(1);
      if (output) {
        output.value = `${type}(${domain}): ${explanation}`;
      }
      if (issueBody) {
        issueBody.value = issueBody.value.replace(
          /Fixes LINEAR_ISSUE_ID/gi,
          `Fixes ${ticket}`,
        );
      }
      assignMeButton?.click?.();
      reviewersInput?.click?.();
      await new Promise((r) => setTimeout(r, 1500));

      for (const reviewerId of reviewersIds) {
        document
          .querySelector<HTMLButtonElement>(reviewerSelector(reviewerId))
          ?.click?.();
        await new Promise((r) => setTimeout(r, 300));
      }
      saveButton?.click?.();
    };
  }
}

void start(
  "https://gitlab.com/noibu/unicron/-/merge_requests?scope=all&state=opened&author_username=sdwvit.noibu",
);
