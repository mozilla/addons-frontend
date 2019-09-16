/* @flow */

export const FETCH_SITE_STATUS: 'FETCH_SITE_STATUS' = 'FETCH_SITE_STATUS';
export const LOAD_SITE_STATUS: 'LOAD_SITE_STATUS' = 'LOAD_SITE_STATUS';

export type ExternalSiteStatus = {
  read_only: boolean,
  notice: string | null,
};

export type SiteState = {
  readOnly: boolean,
  notice: string | null,
};

export const initialState: SiteState = {
  readOnly: false,
  notice: null,
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

type Action = FetchSiteStatusAction | LoadSiteStatusAction;

export default function siteReducer(
  state: SiteState = initialState,
  action: Action,
) {
  switch (action.type) {
    case LOAD_SITE_STATUS:
      return {
        ...state,
        readOnly: action.payload.readOnly,
        notice: action.payload.notice,
      };
    default:
      return state;
  }
}
