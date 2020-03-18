/* @flow */

export type ExternalBlockType = {|
  id: number,
  created: string,
  modified: string,
  guid: string,
  min_version: string,
  max_version: string,
  reason: string | null,
  url: string | null,
|};
