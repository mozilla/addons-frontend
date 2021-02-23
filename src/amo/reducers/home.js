/* @flow */
import config from 'config';
import { LOCATION_CHANGE } from 'connected-react-router';
import invariant from 'invariant';

import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
  ADDON_TYPE_STATIC_THEME,
} from 'amo/constants';
import {
  createInternalAddon,
  selectLocalizedUrlWithOutgoing,
} from 'amo/reducers/addons';
import { SET_CLIENT_APP, SET_LANG } from 'amo/reducers/api';
import { selectLocalizedContent } from 'amo/reducers/utils';
import type { SetClientAppAction } from 'amo/reducers/api';
import type {
  AddonType,
  ExternalAddonType,
  PartialExternalAddonType,
} from 'amo/types/addons';
import type {
  LocalizedString,
  LocalizedUrlWithOutgoing,
  UrlWithOutgoing,
} from 'amo/types/api';

export const ABORT_FETCH_HOME_DATA: 'ABORT_FETCH_HOME_DATA' =
  'ABORT_FETCH_HOME_DATA';
export const FETCH_HOME_DATA: 'FETCH_HOME_DATA' = 'FETCH_HOME_DATA';
export const LOAD_HOME_DATA: 'LOAD_HOME_DATA' = 'LOAD_HOME_DATA';

export type PrimaryHeroShelfExternalAddonType = {|
  id: string,
  guid: string,
  homepage: LocalizedUrlWithOutgoing,
  name: LocalizedString,
  type: string,
|};

export type InternalPrimaryHeroShelfExternalAddonType = {|
  id: string,
  guid: string,
  homepage: UrlWithOutgoing | null,
  name: string,
  type: string,
|};

type HeroGradientType = {|
  start: string,
  end: string,
|};

type BaseExternalPrimaryHeroShelfType = {|
  gradient: HeroGradientType,
  featured_image: string | null,
  description: LocalizedString | null,
|};

type ExternalPrimaryHeroShelfWithAddonType = {|
  ...BaseExternalPrimaryHeroShelfType,
  addon: PartialExternalAddonType,
  external: void,
|};

type ExternalPrimaryHeroShelfWithExternalType = {|
  ...BaseExternalPrimaryHeroShelfType,
  addon: void,
  external: PrimaryHeroShelfExternalAddonType,
|};

export type ExternalPrimaryHeroShelfType =
  | ExternalPrimaryHeroShelfWithAddonType
  | ExternalPrimaryHeroShelfWithExternalType
  | null;

type BasePrimaryHeroShelfType = {|
  gradient: HeroGradientType,
  featuredImage: string | null,
  description: string | null,
|};

type PrimaryHeroShelfWithAddonType = {|
  ...BasePrimaryHeroShelfType,
  addon: AddonType,
  external: void,
|};

type PrimaryHeroShelfWithExternalType = {|
  ...BasePrimaryHeroShelfType,
  addon: void,
  external: InternalPrimaryHeroShelfExternalAddonType,
|};

export type PrimaryHeroShelfType =
  | PrimaryHeroShelfWithAddonType
  | PrimaryHeroShelfWithExternalType
  | null;

export type ExternalHeroCallToActionType = {|
  url: string,
  outgoing: string,
  text: LocalizedString | null,
|};

export type ExternalSecondaryHeroModuleType = {|
  icon: string,
  description: LocalizedString | null,
  cta: ExternalHeroCallToActionType | null,
|};

export type ExternalSecondaryHeroShelfType = {|
  headline: LocalizedString | null,
  description: LocalizedString | null,
  cta: ExternalHeroCallToActionType | null,
  modules: Array<ExternalSecondaryHeroModuleType>,
|} | null;

export type HeroCallToActionType = {|
  url: string,
  outgoing: string,
  text: string,
|};

export type SecondaryHeroModuleType = {|
  icon: string,
  description: string,
  cta: HeroCallToActionType | null,
|};

export type SecondaryHeroShelfType = {|
  headline: string,
  description: string,
  cta: HeroCallToActionType | null,
  modules: Array<SecondaryHeroModuleType>,
|} | null;

export type ExternalHeroShelvesType = {|
  primary: ExternalPrimaryHeroShelfType,
  secondary: ExternalSecondaryHeroShelfType,
|};

export type HeroShelvesType = {|
  primary: PrimaryHeroShelfType,
  secondary: SecondaryHeroShelfType,
|};

export type ExternalResultShelfType = {|
  title: string,
  url: string,
  endpoint: string,
  criteria: string,
  footer_text: string | null,
  footer_pathname: string | null,
  addons: Array<ExternalAddonType>,
|};

export type ResultShelfType = {|
  title: string,
  url: string,
  endpoint: string,
  criteria: string,
  footerText: string | null,
  footerPathname: string | null,
  addons: Array<AddonType>,
|};

export type ExternalHomeShelvesType = {|
  results: Array<ExternalResultShelfType> | null,
  primary: ExternalPrimaryHeroShelfType,
  secondary: ExternalSecondaryHeroShelfType,
|};

export type HomeShelvesType = {|
  results: Array<ResultShelfType> | null,
  primary: PrimaryHeroShelfType,
  secondary: SecondaryHeroShelfType,
|};

export type HomeState = {
  homeShelves: HomeShelvesType | null,
  isLoading: boolean,
  lang: string,
  resetStateOnNextChange: boolean,
  resultsLoaded: boolean,
};

export const initialState: HomeState = {
  homeShelves: null,
  isLoading: false,
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
  resetStateOnNextChange: false,
  resultsLoaded: false,
};

export type AbortFetchHomeDataAction = {| type: typeof ABORT_FETCH_HOME_DATA |};

export const abortFetchHomeData = (): AbortFetchHomeDataAction => {
  return { type: ABORT_FETCH_HOME_DATA };
};

type FetchHomeDataParams = {|
  errorHandlerId: string,
|};

export type FetchHomeDataAction = {|
  type: typeof FETCH_HOME_DATA,
  payload: FetchHomeDataParams,
|};

export const fetchHomeData = ({
  errorHandlerId,
}: FetchHomeDataParams): FetchHomeDataAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: FETCH_HOME_DATA,
    payload: {
      errorHandlerId,
    },
  };
};

type LoadHomeDataParams = {|
  homeShelves: ExternalHomeShelvesType,
|};

type LoadHomeDataAction = {|
  type: typeof LOAD_HOME_DATA,
  payload: LoadHomeDataParams,
|};

export const loadHomeData = ({
  homeShelves,
}: LoadHomeDataParams): LoadHomeDataAction => {
  invariant(homeShelves, 'homeShelves is required');

  return {
    type: LOAD_HOME_DATA,
    payload: {
      homeShelves,
    },
  };
};

type Action =
  | AbortFetchHomeDataAction
  | FetchHomeDataAction
  | LoadHomeDataAction
  | SetClientAppAction;

export const createInternalShelf = (
  result: ExternalResultShelfType,
  lang: string,
): ResultShelfType => {
  const sliceEnd =
    ADDON_TYPE_STATIC_THEME === result.addons[0].type
      ? LANDING_PAGE_THEME_COUNT
      : LANDING_PAGE_EXTENSION_COUNT;

  const shelfAddons = result.addons.slice(0, sliceEnd).map((addon) => {
    return createInternalAddon(addon, lang);
  });

  return {
    title: result.title,
    url: result.url,
    endpoint: result.endpoint,
    criteria: result.criteria,
    footerText: result.footer_text,
    footerPathname: result.footer_pathname,
    addons: shelfAddons,
  };
};

export const createInternalPrimaryHeroShelfExternalAddon = (
  external: PrimaryHeroShelfExternalAddonType,
  lang: string,
): InternalPrimaryHeroShelfExternalAddonType => {
  const { id, guid, homepage, name, type } = external;

  return {
    id,
    guid,
    homepage: selectLocalizedUrlWithOutgoing(homepage, lang),
    name: selectLocalizedContent(name, lang),
    type,
  };
};

export const createInternalHeroCallToAction = (
  cta: ExternalHeroCallToActionType,
  lang: string,
): HeroCallToActionType => {
  return {
    url: cta.url,
    outgoing: cta.outgoing,
    text: selectLocalizedContent(cta.text, lang),
  };
};

export const createInternalSecondaryHeroModule = (
  module: ExternalSecondaryHeroModuleType,
  lang: string,
): SecondaryHeroModuleType => {
  return {
    icon: module.icon,
    description: selectLocalizedContent(module.description, lang),
    cta: module.cta ? createInternalHeroCallToAction(module.cta, lang) : null,
  };
};

export const createInternalHomeShelves = (
  homeShelves: ExternalHomeShelvesType,
  lang: string,
): HomeShelvesType => {
  const { results, primary, secondary } = homeShelves;

  let customShelves: Array<ResultShelfType> | null = null;
  if (results !== null) {
    customShelves = results.map((result) => createInternalShelf(result, lang));
  }

  let secondaryShelf: SecondaryHeroShelfType | null = null;
  if (secondary !== null) {
    secondaryShelf = {
      headline: selectLocalizedContent(secondary.headline, lang),
      description: selectLocalizedContent(secondary.description, lang),
      cta: secondary.cta
        ? createInternalHeroCallToAction(secondary.cta, lang)
        : null,
      modules: secondary.modules.map((module) =>
        createInternalSecondaryHeroModule(module, lang),
      ),
    };
  }

  if (primary === null) {
    return {
      results: customShelves,
      primary: null,
      secondary: secondaryShelf,
    };
  }

  invariant(
    primary.addon || primary.external,
    'Either primary.addon or primary.external is required',
  );

  const basePrimaryShelf = {
    gradient: primary.gradient,
    featuredImage: primary.featured_image,
    description: selectLocalizedContent(primary.description, lang),
  };

  if (primary.addon) {
    const primaryShelf: PrimaryHeroShelfWithAddonType = {
      ...basePrimaryShelf,
      addon: createInternalAddon(primary.addon, lang),
      external: undefined,
    };
    return {
      results: customShelves,
      primary: primaryShelf,
      secondary: secondaryShelf,
    };
  }

  const primaryShelf: PrimaryHeroShelfWithExternalType = {
    ...basePrimaryShelf,
    addon: undefined,
    external: createInternalPrimaryHeroShelfExternalAddon(
      primary.external,
      lang,
    ),
  };
  return {
    results: customShelves,
    primary: primaryShelf,
    secondary: secondaryShelf,
  };
};

const reducer = (
  state: HomeState = initialState,
  action: Action,
  _config: typeof config = config,
): HomeState => {
  switch (action.type) {
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };

    case SET_CLIENT_APP:
      return {
        ...initialState,
        lang: state.lang,
      };

    case ABORT_FETCH_HOME_DATA:
      return {
        ...state,
        isLoading: false,
      };

    case FETCH_HOME_DATA:
      return {
        ...state,
        isLoading: true,
        resultsLoaded: false,
      };

    case LOAD_HOME_DATA: {
      const { homeShelves } = action.payload;

      return {
        ...state,
        homeShelves: createInternalHomeShelves(homeShelves, state.lang),
        isLoading: false,
        resultsLoaded: true,
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
      // back to the homepage.
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
