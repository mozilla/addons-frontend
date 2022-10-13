export type I18nType = {
  // This accepts string input to accomodate usage of number.toFixed()
  formatNumber: (arg0: number | string) => string;
  gettext: (arg0: string) => string;
  ngettext: (arg0: string, arg1: string, arg2: number) => string;
  moment: (arg0: Date | string) => {
    format: (arg0: string) => string;
    fromNow: () => string;
  };
  sprintf: (arg0: string, arg1: Record<string, unknown>) => string;
};