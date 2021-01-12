/* @flow */
import config from 'config';
import { LOCATION_CHANGE } from 'connected-react-router';
import invariant from 'invariant';

import type { AppState } from 'amo/store';
import { createInternalAddon } from 'amo/reducers/addons';
import { SET_LANG } from 'amo/reducers/api';
import type { AddonType, ExternalAddonType } from 'amo/types/addons';

export const ABORT_FETCH_SPONSORED: 'ABORT_FETCH_SPONSORED' =
  'ABORT_FETCH_SPONSORED';
export const FETCH_SPONSORED: 'FETCH_SPONSORED' = 'FETCH_SPONSORED';
export const LOAD_SPONSORED: 'LOAD_SPONSORED' = 'LOAD_SPONSORED';

export type ExternalSponsoredShelfType = {|
  results: Array<ExternalAddonType>,
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
  lang: string,
  resetStateOnNextChange: boolean,
  sponsored: SponsoredShelfType | null | void,
|};

export const initialState: ShelvesState = {
  isLoading: false,
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
  resetStateOnNextChange: false,
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
  lang: string,
): SponsoredShelfType => {
  const { results, impression_data, impression_url } = shelfData;

  return {
    addons: results.map((addon) => createInternalAddon(addon, lang)),
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
  _config: typeof config = config,
): ShelvesState => {
  switch (action.type) {
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };
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
        sponsored: createInternalsponsoredShelf(shelfData, state.lang),
      };
    }

    // See: https://github.com/mozilla/addons-frontend/issues/8601
    case LOCATION_CHANGE: {
      if (_config.get('server')) {
        // We only care about client side navigation.
        return state;
      }
      // When the client initializes, it updates its location. On next location
      // change, we want to reset this state to fetch fresh data once user goes
      // back to the homepage, but we need to keep the lang.
      if (state.resetStateOnNextChange) {
        return {
          ...initialState,
          lang: state.lang,
        };
      }

      return {
        ...state,
        // This will only be set *after* a single location change on the client.
        resetStateOnNextChange: true,
      };
    }

    default:
      return state;
  }
};

export default reducer;
