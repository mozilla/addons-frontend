/* @flow */
import invariant from 'invariant';

import type { AppState } from 'amo/store';
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const ABORT_FETCH_SPONSORED: 'ABORT_FETCH_SPONSORED' =
  'ABORT_FETCH_SPONSORED';
export const FETCH_SPONSORED: 'FETCH_SPONSORED' = 'FETCH_SPONSORED';
export const LOAD_SPONSORED: 'LOAD_SPONSORED' = 'LOAD_SPONSORED';

export type ExternalSponsoredShelfType = {|
  addons: Array<ExternalAddonType>,
  impression_data: string | null,
  impression_url: string | null,
|};

export type SponsoredShelfType = {|
  addons: Array<AddonType>,
  impressionData: string | null,
  impressionURL: string | null,
|};

export type ShelvesState = {|
  isLoading: boolean,
  sponsored: SponsoredShelfType | null | void,
|};

export const initialState: ShelvesState = {
  isLoading: false,
  sponsored: undefined,
};

type AbortFetchSponsoredAction = {| type: typeof ABORT_FETCH_SPONSORED |};

export const abortFetchSponsored = (): AbortFetchSponsoredAction => {
  return { type: ABORT_FETCH_SPONSORED };
};

type FetchSponsoredParams = {| errorHandlerId: string |};

export type FetchSponsoredAction = {|
  type: typeof FETCH_SPONSORED,
  payload: FetchSponsoredParams,
|};

export const fetchSponsored = ({
  errorHandlerId,
}: FetchSponsoredParams): FetchSponsoredAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');

  return { type: FETCH_SPONSORED, payload: { errorHandlerId } };
};

export type LoadSponsoredParams = {| shelfData: ExternalSponsoredShelfType |};

type LoadSponsoredAction = {|
  type: typeof LOAD_SPONSORED,
  payload: LoadSponsoredParams,
|};

export const loadSponsored = ({
  shelfData,
}: LoadSponsoredParams): LoadSponsoredAction => {
  invariant(shelfData, 'shelfData is required');

  return {
    type: LOAD_SPONSORED,
    payload: { shelfData },
  };
};

export const getSponsoredShelf = (
  state: AppState,
): SponsoredShelfType | null | void => {
  return state.shelves.sponsored;
};

export const createInternalsponsoredShelf = (
  shelfData: ExternalSponsoredShelfType,
): SponsoredShelfType => {
  const { addons, impression_data, impression_url } = shelfData;

  return {
    addons: addons.map((addon) => createInternalAddon(addon)),
    impressionData: impression_data,
    impressionURL: impression_url,
  };
};

type Action =
  | AbortFetchSponsoredAction
  | FetchSponsoredAction
  | LoadSponsoredAction;

const reducer = (
  state: ShelvesState = initialState,
  action: Action,
): ShelvesState => {
  switch (action.type) {
    case ABORT_FETCH_SPONSORED:
      return {
        ...state,
        isLoading: false,
        sponsored: null,
      };

    case FETCH_SPONSORED:
      return {
        ...state,
        isLoading: true,
        sponsored: undefined,
      };

    case LOAD_SPONSORED: {
      const { shelfData } = action.payload;

      return {
        ...state,
        isLoading: false,
        sponsored: createInternalsponsoredShelf(shelfData),
      };
    }

    default:
      return state;
  }
};

export default reducer;
