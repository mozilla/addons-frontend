/* @flow */
import invariant from 'invariant';

export const FETCH_GUIDES_ADDONS: 'FETCH_GUIDES_ADDONS' = 'FETCH_GUIDES_ADDONS';

export type FetchGuidesParams = {|
  errorHandlerId: string,
  guid: string,
|};

export type FetchGuidesAction = {|
  type: typeof FETCH_GUIDES_ADDONS,
  payload: FetchGuidesParams,
|};

export const fetchGuidesAddons = ({
  errorHandlerId,
  guid,
}: FetchGuidesParams): FetchGuidesAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guid, 'guid is required');

  return {
    type: FETCH_GUIDES_ADDONS,
    payload: { guid, errorHandlerId },
  };
};
