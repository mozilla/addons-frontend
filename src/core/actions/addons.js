/* @flow */
import { FETCH_ADDON } from 'core/constants';
import type { ErrorHandlerType } from 'core/errorHandler';

type FetchAddonParams = {|
  errorHandler: ErrorHandlerType,
  slug: string,
|};

export type FetchAddonAction = {|
  type: string,
  payload: {|
    errorHandlerId: string,
    slug: string,
  |},
|};

export function fetchAddon({ errorHandler, slug }: FetchAddonParams): FetchAddonAction {
  if (!errorHandler) {
    throw new Error('errorHandler cannot be empty');
  }
  if (!slug) {
    throw new Error('slug cannot be empty');
  }
  return {
    type: FETCH_ADDON,
    payload: { errorHandlerId: errorHandler.id, slug },
  };
}
