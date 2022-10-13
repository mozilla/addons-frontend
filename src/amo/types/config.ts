export type ConfigType = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
};