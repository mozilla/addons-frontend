/* @flow */
import config from 'config';
import { LOCATION_CHANGE } from 'redux-first-history';
import invariant from 'invariant';

import {
  createInternalAddon,
  selectLocalizedUrlWithOutgoing,
} from 'amo/reducers/addons';
import { SET_CLIENT_APP, SET_LANG } from 'amo/reducers/api';
import { selectLocalizedContent } from 'amo/reducers/utils';
import type { AddonTypeType } from 'amo/constants';
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
  name: string | null,
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

export type ExternalLinkWithTextType = {|
  url: string,
  outgoing: string,
  text: LocalizedString | null,
|};

export type ExternalSecondaryHeroModuleType = {|
  icon: string,
  description: LocalizedString | null,
  cta: ExternalLinkWithTextType | null,
|};

export type ExternalSecondaryHeroShelfType = {|
  headline: LocalizedString | null,
  description: LocalizedString | null,
  cta: ExternalLinkWithTextType | null,
  modules: Array<ExternalSecondaryHeroModuleType>,
|} | null;

export type LinkWithTextType = {|
  url: string,
  outgoing: string,
  text: string | null,
|};

export type SecondaryHeroModuleType = {|
  icon: string,
  description: string | null,
  cta: LinkWithTextType | null,
|};

export type SecondaryHeroShelfType = {|
  headline: string | null,
  description: string | null,
  cta: LinkWithTextType | null,
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
  title: LocalizedString,
  url: string,
  endpoint: string,
  addon_type: AddonTypeType,
  footer: ExternalLinkWithTextType,
  addons: Array<ExternalAddonType>,
|};

export type ResultShelfType = {|
  title: string | null,
  url: string,
  endpoint: string,
  addonType: AddonTypeType,
  footer: LinkWithTextType,
  addons: Array<AddonType>,
|};

export type ExternalHomeShelvesType = {|
  results: Array<ExternalResultShelfType>,
  primary: ExternalPrimaryHeroShelfType,
  secondary: ExternalSecondaryHeroShelfType,
|};

export type HomeShelvesType = {|
  results: Array<ResultShelfType>,
  primary: PrimaryHeroShelfType,
  secondary: SecondaryHeroShelfType,
|};

export type HomeState = {
  homeShelves: HomeShelvesType | null,
  isLoading: boolean,
  lang: string,
  resetStateOnNextChange: boolean,
  resultsLoaded: boolean,
  shelves: { [shelfName: string]: Array<AddonType> },
};

export const initialState: HomeState = {
  homeShelves: null,
  isLoading: false,
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
  resetStateOnNextChange: false,
  resultsLoaded: false,
  shelves: {},
};

export type AbortFetchHomeDataAction = {| type: typeof ABORT_FETCH_HOME_DATA |};

export const abortFetchHomeData = (): AbortFetchHomeDataAction => {
  return { type: ABORT_FETCH_HOME_DATA };
};

type FetchHomeDataParams = {|
  errorHandlerId: string,
  isDesktopSite: boolean,
|};

export type FetchHomeDataAction = {|
  type: typeof FETCH_HOME_DATA,
  payload: FetchHomeDataParams,
|};

export const fetchHomeData = ({
  errorHandlerId,
  isDesktopSite,
}: FetchHomeDataParams): FetchHomeDataAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: FETCH_HOME_DATA,
    payload: {
      errorHandlerId,
      isDesktopSite,
    },
  };
};

type ApiAddonsResponse = {|
  count: number,
  results: Array<ExternalAddonType>,
|};

type LoadHomeDataParams = {|
  homeShelves: ExternalHomeShelvesType | null,
  shelves: { [shelfName: string]: ApiAddonsResponse },
|};

type LoadHomeDataAction = {|
  type: typeof LOAD_HOME_DATA,
  payload: LoadHomeDataParams,
|};

export const loadHomeData = ({
  homeShelves,
  shelves,
}: LoadHomeDataParams): LoadHomeDataAction => {
  invariant(shelves, 'shelves are required');
  return {
    type: LOAD_HOME_DATA,
    payload: { homeShelves, shelves },
  };
};

type Action =
  | AbortFetchHomeDataAction
  | FetchHomeDataAction
  | LoadHomeDataAction
  | SetClientAppAction;

const createInternalAddons = (
  response: ApiAddonsResponse,
  lang: string,
): Array<AddonType> => {
  return response.results.map((addon) => createInternalAddon(addon, lang));
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

export const createInternalLinkWithText = (
  obj: ExternalLinkWithTextType,
  lang: string,
): LinkWithTextType => {
  return {
    url: obj.url,
    outgoing: obj.outgoing,
    text: selectLocalizedContent(obj.text, lang),
  };
};

export const createInternalSecondaryHeroModule = (
  module: ExternalSecondaryHeroModuleType,
  lang: string,
): SecondaryHeroModuleType => {
  return {
    icon: module.icon,
    description: selectLocalizedContent(module.description, lang),
    cta: module.cta ? createInternalLinkWithText(module.cta, lang) : null,
  };
};

export const createInternalShelf = (
  result: ExternalResultShelfType,
  lang: string,
): ResultShelfType => {
  const shelfAddons = result.addons.map((addon) => {
    return createInternalAddon(addon, lang);
  });

  return {
    title: selectLocalizedContent(result.title, lang),
    url: result.url,
    endpoint: result.endpoint,
    addonType: result.addon_type,
    footer: createInternalLinkWithText(result.footer, lang),
    addons: shelfAddons,
  };
};

export const createInternalHomeShelves = (
  homeShelves: ExternalHomeShelvesType,
  lang: string,
): HomeShelvesType => {
  const { results, primary, secondary } = homeShelves;

  const customShelves: Array<ResultShelfType> = results.map((result) =>
    createInternalShelf(result, lang),
  );

  let secondaryShelf: SecondaryHeroShelfType | null = null;
  if (secondary !== null) {
    secondaryShelf = {
      headline: selectLocalizedContent(secondary.headline, lang),
      description: selectLocalizedContent(secondary.description, lang),
      cta: secondary.cta
        ? createInternalLinkWithText(secondary.cta, lang)
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
  // eslint-disable-next-line default-param-last
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
      const { homeShelves, shelves } = action.payload;

      return {
        ...state,
        homeShelves: homeShelves
          ? createInternalHomeShelves(homeShelves, state.lang)
          : null,
        isLoading: false,
        resultsLoaded: true,
        // $FlowIgnore: flow can't be sure that reduce result will patch the shelves type definition, let's trust the test coverage here.
        shelves: Object.keys(shelves).reduce((shelvesToLoad, shelfName) => {
          const response = shelves[shelfName];

          return {
            ...shelvesToLoad,
            [shelfName]: response
              ? createInternalAddons(response, state.lang)
              : [],
          };
        }, {}),
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
