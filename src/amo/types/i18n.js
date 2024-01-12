/* @flow */

export type I18nType = {|
  // This accepts string input to accomodate usage of number.toFixed()
  formatNumber: (number | string) => string,
  gettext: (string) => string,
  ngettext: (string, string, number) => string,
  moment: (Date | string) => {|
    format: (string) => string,
    fromNow: () => string,
  |},
  sprintf: (string, { [placeholder: string]: mixed }) => string,
|};

export type I18nextType = {|
  t(key: string, options?: { [key: string]: mixed }): string,
|};
