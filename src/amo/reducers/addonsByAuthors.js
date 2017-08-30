/* @flow */
import type { AddonType } from 'core/types/addons';


type State = {
  byAddonSlug: { [string]: AddonType },
};

export const initialState: State = {
  byAddonSlug: {},
};

export const OTHER_ADDONS_BY_AUTHORS_PAGE_SIZE = 6;

// For further information about this notation, see:
// https://github.com/mozilla/addons-frontend/pull/3027#discussion_r137661289
export const FETCH_OTHER_ADDONS_BY_AUTHORS: 'FETCH_OTHER_ADDONS_BY_AUTHORS'
  = 'FETCH_OTHER_ADDONS_BY_AUTHORS';
export const LOAD_OTHER_ADDONS_BY_AUTHORS: 'LOAD_OTHER_ADDONS_BY_AUTHORS'
  = 'LOAD_OTHER_ADDONS_BY_AUTHORS';

type FetchOtherAddonsByAuthorsParams = {|
  addonType: string,
  authors: Array<string>,
  errorHandlerId: string,
  slug: string,
|};

type FetchOtherAddonsByAuthorsAction = {|
  type: typeof FETCH_OTHER_ADDONS_BY_AUTHORS,
  payload: FetchOtherAddonsByAuthorsParams,
|};

export const fetchOtherAddonsByAuthors = (
  { addonType, authors, errorHandlerId, slug }: FetchOtherAddonsByAuthorsParams
): FetchOtherAddonsByAuthorsAction => {
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
    type: FETCH_OTHER_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      authors,
      errorHandlerId,
      slug,
    },
  };
};

type LoadOtherAddonsByAuthorsParams = {|
  slug: string,
  addons: Array<AddonType>,
|};

type LoadOtherAddonsByAuthorsAction = {|
  type: typeof LOAD_OTHER_ADDONS_BY_AUTHORS,
  payload: LoadOtherAddonsByAuthorsParams,
|};

export const loadOtherAddonsByAuthors = (
  { addons, slug }: LoadOtherAddonsByAuthorsParams
): LoadOtherAddonsByAuthorsAction => {
  if (!slug) {
    throw new Error('An add-on slug is required.');
  }

  if (!addons) {
    throw new Error('A set of add-ons is required.');
  }

  return {
    type: LOAD_OTHER_ADDONS_BY_AUTHORS,
    payload: { slug, addons },
  };
};

type Action =
  | FetchOtherAddonsByAuthorsAction
  | LoadOtherAddonsByAuthorsAction;

const reducer = (
  state: State = initialState,
  action: Action
): State => {
  switch (action.type) {
    case FETCH_OTHER_ADDONS_BY_AUTHORS: {
      const payload = action.payload;

      return {
        ...state,
        byAddonSlug: {
          ...state.byAddonSlug,
          [payload.slug]: undefined,
        },
      };
    }
    case LOAD_OTHER_ADDONS_BY_AUTHORS: {
      const payload = action.payload;

      return {
        ...state,
        byAddonSlug: {
          ...state.byAddonSlug,
          [payload.slug]: payload.addons
            // This ensures we do not display the main add-on in the list of
            // "add-ons by these authors".
            .filter((addon) => addon.slug !== payload.slug)
            .slice(0, OTHER_ADDONS_BY_AUTHORS_PAGE_SIZE),
        },
      };
    }
    default:
      return state;
  }
};

export default reducer;
