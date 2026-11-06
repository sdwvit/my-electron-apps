import { shell } from "electron";
import { getAppConfig } from "./config";

// URLs that must stay in the app even though they are on another host (sign-in flows etc).
const INTERNAL_PATTERN = /auth|sign_in|gitlab|account|chatgpt/;
const EXTERNAL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

const parse = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

const homeHost = () => parse(getAppConfig().homeUrl)?.host;

export const isWebUrl = (url: string) => {
  const protocol = parse(url)?.protocol;
  return protocol === "http:" || protocol === "https:";
};

/** Whether a URL belongs in the app window rather than the system browser. */
export const isInternalUrl = (url: string) => {
  const parsed = parse(url);
  if (!parsed || !isWebUrl(url)) {
    return false;
  }
  return parsed.host === homeHost() || INTERNAL_PATTERN.test(url);
};

/** Whether the URL is on a different site than the app's home page. */
export const isOffHome = (url: string) => {
  const parsed = parse(url);
  return !!parsed && isWebUrl(url) && parsed.host !== homeHost();
};

export const openExternal = (url: string) => {
  const parsed = parse(url);
  if (parsed && EXTERNAL_SCHEMES.has(parsed.protocol)) {
    void shell.openExternal(url);
  }
};

export const displayUrl = (url: string) => {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
};
