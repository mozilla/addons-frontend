/* @flow */
export const MZA_LAUNCH_DATETIME: Date = new Date(
  // 2023-11-01 19:00:00 UTC
  Date.UTC(2023, 10, 1, 19, 0, 0, 0),
);
export const isMzaBranding = (): boolean => new Date() >= MZA_LAUNCH_DATETIME;
