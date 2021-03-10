/* @flow */

export type ConfigType = {|
  get: (key: string) => mixed,
  set: (key: string, value: mixed) => void,
|};
