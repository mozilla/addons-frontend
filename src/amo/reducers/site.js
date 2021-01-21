/* @flow */
export const FETCH_SITE_STATUS: 'FETCH_SITE_STATUS' = 'FETCH_SITE_STATUS';
export const LOAD_SITE_STATUS: 'LOAD_SITE_STATUS' = 'LOAD_SITE_STATUS';
export const LOADED_PAGE_IS_ANONYMOUS: 'LOADED_PAGE_IS_ANONYMOUS' =
  'LOADED_PAGE_IS_ANONYMOUS';

export type ExternalSiteStatus = {
  read_only: boolean,
  notice: string | null,
};

export type SiteState = {
  readOnly: boolean,
  notice: string | null,
  loadedPageIsAnonymous: boolean,
};

export const initialState: SiteState = {
  readOnly: false,
  notice: null,
  loadedPageIsAnonymous: false,
};

export type FetchSiteStatusAction = {|
  type: typeof FETCH_SITE_STATUS,
  payload: {},
|};

export const fetchSiteStatus = (): FetchSiteStatusAction => {
  return {
    type: FETCH_SITE_STATUS,
    payload: {},
  };
};

type LoadSiteStatusParams = {|
  readOnly: boolean,
  notice: string | null,
|};

export type LoadSiteStatusAction = {|
  type: typeof LOAD_SITE_STATUS,
  payload: LoadSiteStatusParams,
|};

export const loadSiteStatus = ({
  readOnly,
  notice,
}: LoadSiteStatusParams): LoadSiteStatusAction => {
  return {
    type: LOAD_SITE_STATUS,
    payload: { readOnly, notice },
  };
};

export type LoadedPageIsAnonymousAction = {|
  type: typeof LOADED_PAGE_IS_ANONYMOUS,
  payload: {},
|};

export const loadedPageIsAnonymous = (): LoadedPageIsAnonymousAction => {
  return {
    type: LOADED_PAGE_IS_ANONYMOUS,
    payload: {},
  };
};

type Action =
  | FetchSiteStatusAction
  | LoadSiteStatusAction
  | LoadedPageIsAnonymousAction;

export default function siteReducer(
  state: SiteState = initialState,
  action: Action,
): 
  | SiteState
  | {
    loadedPageIsAnonymous: boolean,
    notice: null | string,
    readOnly: boolean,
    ...,
  }
  | {
    loadedPageIsAnonymous: boolean,
    notice: string | null,
    readOnly: boolean,
    ...,
  } {
  switch (action.type) {
    case LOAD_SITE_STATUS:
      return {
        ...state,
        readOnly: action.payload.readOnly,
        notice: action.payload.notice,
      };
    case LOADED_PAGE_IS_ANONYMOUS:
      return {
        ...state,
        loadedPageIsAnonymous: true,
      };
    default:
      return state;
  }
}
