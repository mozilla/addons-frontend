/* @flow */
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  popularExtensions: ?Array<AddonType>,
};

export const initialState: HomeState = {
  popularExtensions: null,
};

type FetchHomeAddonsParams = {|
  errorHandlerId: string,
|};

type FetchHomeAddonsAction = {|
  type: typeof FETCH_HOME_ADDONS,
  payload: FetchHomeAddonsParams,
|};

export const fetchHomeAddons = ({
  errorHandlerId,
}: FetchHomeAddonsParams): FetchHomeAddonsAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }

  return {
    type: FETCH_HOME_ADDONS,
    payload: { errorHandlerId },
  };
};

type ExternalAddonMap = {
  [addonSlug: string]: ExternalAddonType,
};

type LoadHomeAddonsParams = {|
  popularExtensions: {|
    result: {|
      count: number,
      results: Array<string>,
    |},
    entities: {|
      addons: ExternalAddonMap,
    |},
  |},
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  popularExtensions,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  if (!popularExtensions) {
    throw new Error('popularExtensions is required');
  }

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      popularExtensions,
    },
  };
};

type Action =
  | FetchHomeAddonsAction
  | LoadHomeAddonsAction;

const reducer = (
  state: HomeState = initialState,
  action: Action
): HomeState => {
  switch (action.type) {
    case LOAD_HOME_ADDONS: {
      const { popularExtensions } = action.payload;

      return {
        ...state,
        popularExtensions: popularExtensions.result.results.map((slug) => (
          createInternalAddon(popularExtensions.entities.addons[slug])
        )),
      };
    }

    default:
      return state;
  }
};

export default reducer;
