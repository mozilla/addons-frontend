/* @flow */
import { FETCH_ADDON } from 'core/constants';

type FetchAddonParams = {|
  slug: string,
|};

export type FetchAddonAction = {|
  type: string,
  payload: {|
    slug: string,
  |},
|};

export function fetchAddon({ slug }: FetchAddonParams): FetchAddonAction {
  if (!slug) {
    throw new Error('slug cannot be empty');
  }
  return {
    type: FETCH_ADDON,
    payload: { slug },
  };
}
