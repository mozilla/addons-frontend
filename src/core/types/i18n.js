/* @flow */

export type I18nType = {|
  formatNumber: (number) => string,
  gettext: (string) => string,
  ngettext: (string, string, number) => string,
  moment: (
    Date | string,
  ) => {|
    format: (string) => string,
    fromNow: () => string,
  |},
  sprintf: (string, { [placeholder: string]: any }) => string,
|};
