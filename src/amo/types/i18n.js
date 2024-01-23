/* @flow */

export type I18nType = {|
  formatNumber: (number | string) => string,
  moment: (Date | string) => {|
    format: (string) => string,
    fromNow: () => string,
  |},
  t: (key: string, params?: { [placeholder: string]: mixed }) => string,
|};
