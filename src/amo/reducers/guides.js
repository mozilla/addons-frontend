/* @flow */
import invariant from 'invariant';

import { LOAD_ADDON_RESULTS } from 'core/reducers/addons';

export const FETCH_GUIDES_ADDONS: 'FETCH_GUIDES_ADDONS' = 'FETCH_GUIDES_ADDONS';

export type GuidesState = {|
  guidsBySlug: {
    [slug: string]: Array<string>,
  },
  loading: boolean,
|};

export const initialState: GuidesState = {
  guidsBySlug: {},
  loading: false,
};

export type FetchGuidesParams = {|
  errorHandlerId: string,
  guids: Array<string>,
  slug: string,
|};

export type FetchGuidesAction = {|
  type: typeof FETCH_GUIDES_ADDONS,
  payload: FetchGuidesParams,
|};

export const fetchGuidesAddons = ({
  errorHandlerId,
  guids,
  slug,
}: FetchGuidesParams): FetchGuidesAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guids, 'guids is required');
  invariant(slug, 'slug is required');

  return {
    type: FETCH_GUIDES_ADDONS,
    payload: { guids, errorHandlerId, slug },
  };
};

export const getGUIDsBySlug = ({
  guidesState,
  slug,
}: {|
  guidesState: GuidesState,
  slug: string,
|}): Array<string> => {
  return guidesState.guidsBySlug[slug] || [];
};

const reducer = (
  state: GuidesState = initialState,
  action: FetchGuidesAction,
): GuidesState => {
  switch (action.type) {
    case FETCH_GUIDES_ADDONS: {
      const { guids, slug } = action.payload;

      return {
        ...state,
        guidsBySlug: {
          ...state.guidsBySlug,
          [slug]: guids,
        },
        loading: true,
      };
    }
    case LOAD_ADDON_RESULTS:
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

export default reducer;
