/* @flow */
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_SEARCH,
  ADDON_TYPE_THEME,
  validAddonTypes as defaultValidAddonTypes,
} from 'core/constants';

// TODO: Are all these fields actually in addon.current_version
export type AddonVersionType = {|
  id: number,
  license: { name: string, url: string },
  version: string,
  files: Array<string>,
|};

export type AddonAuthorType = {|
  name: string,
  url: string,
|};

export type AddonTypeProp =
  typeof ADDON_TYPE_DICT |
  typeof ADDON_TYPE_LANG |
  typeof ADDON_TYPE_SEARCH |
  typeof ADDON_TYPE_THEME |
  typeof ADDON_TYPE_EXTENSION;

export type AddonType = {|
  id: number,
  guid: string,
  name: string,
  icon_url: string,
  slug: string,
  average_daily_users: number,
  authors: Array<AddonAuthorType>,
  current_version: AddonVersionType,
  previews: Array<Object>,
  ratings: {
    count: number,
    average: number,
  },
  summary: string,
  description: string,
  has_privacy_policy: boolean,
  homepage: string,
  support_url: string,
  type: AddonTypeProp,
|};
