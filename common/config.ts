import type { MenuItemConstructorOptions } from "electron";

export type AppConfig = {
  homeUrl: string;
  customItems: MenuItemConstructorOptions[];
  userAgent?: string;
};

let config: AppConfig = { homeUrl: "about:blank", customItems: [] };

export const setAppConfig = (next: AppConfig) => {
  config = next;
};

export const getAppConfig = () => config;
