/* @flow */
import type { AddonType, ExternalAddonType } from 'core/types/addons';
import { createInternalAddon } from 'core/reducers/addons';


type State = {
  byAddonSlug: { [string]: AddonType },
};

export const initialState: State = {
  byAddonSlug: {},
};

export const ADDONS_BY_AUTHORS_PAGE_SIZE = 6;

// For further information about this notation, see:
// https://github.com/mozilla/addons-frontend/pull/3027#discussion_r137661289
export const FETCH_ADDONS_BY_AUTHORS: 'FETCH_ADDONS_BY_AUTHORS'
  = 'FETCH_ADDONS_BY_AUTHORS';
export const LOAD_ADDONS_BY_AUTHORS: 'LOAD_ADDONS_BY_AUTHORS'
  = 'LOAD_ADDONS_BY_AUTHORS';

type FetchAddonsByAuthorsParams = {|
  addonType: string,
  authors: Array<string>,
  errorHandlerId: string,
  slug: string,
|};

type FetchAddonsByAuthorsAction = {|
  type: typeof FETCH_ADDONS_BY_AUTHORS,
  payload: FetchAddonsByAuthorsParams,
|};

export const fetchAddonsByAuthors = (
  { addonType, authors, errorHandlerId, slug }: FetchAddonsByAuthorsParams
): FetchAddonsByAuthorsAction => {
  if (!errorHandlerId) {
    throw new Error('An errorHandlerId is required');
  }

  if (!slug) {
    throw new Error('An add-on slug is required.');
  }

  if (!addonType) {
    throw new Error('An add-on type is required.');
  }

  if (!authors) {
    throw new Error('Authors are required.');
  }

  if (!Array.isArray(authors)) {
    throw new Error('The authors parameter must be an array.');
  }

  return {
    type: FETCH_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      authors,
      errorHandlerId,
      slug,
    },
  };
};

type LoadAddonsByAuthorsParams = {|
  slug: string,
  addons: Array<ExternalAddonType>,
|};

type LoadAddonsByAuthorsAction = {|
  type: typeof LOAD_ADDONS_BY_AUTHORS,
  payload: LoadAddonsByAuthorsParams,
|};

export const loadAddonsByAuthors = (
  { addons, slug }: LoadAddonsByAuthorsParams
): LoadAddonsByAuthorsAction => {
  if (!slug) {
    throw new Error('An add-on slug is required.');
  }

  if (!addons) {
    throw new Error('A set of add-ons is required.');
  }

  return {
    type: LOAD_ADDONS_BY_AUTHORS,
    payload: { slug, addons },
  };
};

type Action =
  | FetchAddonsByAuthorsAction
  | LoadAddonsByAuthorsAction;

const reducer = (
  state: State = initialState,
  action: Action
): State => {
  switch (action.type) {
    case FETCH_ADDONS_BY_AUTHORS:
      return {
        ...state,
        byAddonSlug: {
          ...state.byAddonSlug,
          [action.payload.slug]: undefined,
        },
      };
    case LOAD_ADDONS_BY_AUTHORS:
      return {
        ...state,
        byAddonSlug: {
          ...state.byAddonSlug,
          [action.payload.slug]: action.payload.addons
            .slice(0, ADDONS_BY_AUTHORS_PAGE_SIZE)
            .map((addon) => createInternalAddon(addon)),
        },
      };
    default:
      return state;
  }
};

export default reducer;
