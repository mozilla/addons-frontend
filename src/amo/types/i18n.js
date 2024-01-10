/* @flow */

export type I18nType = {|
  // This accepts string input to accomodate usage of number.toFixed()
  formatNumber: (number | string) => string,
  moment: (Date | string) => {|
    format: (string) => string,
    fromNow: () => string,
  |},
  t: (key: string, options: mixed) => string,
|};
