/* @flow */

export type ConfigType = {|
  get: (key: string) => any,
  set: (key: string, value: any) => void,
|};
