/* @flow */
export const MZA_LAUNCH_DATETIME: Date = new Date(
  Date.UTC(2023, 10, 1, 19, 0, 0, 0),
);
export const isMzaBranding = (): boolean =>
  new Date().getTime() >= MZA_LAUNCH_DATETIME.getTime();
