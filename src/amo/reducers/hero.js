/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, PartialExternalAddonType } from 'core/types/addons';

export const ABORT_FETCH_HERO_SHELVES: 'ABORT_FETCH_HERO_SHELVES' =
  'ABORT_FETCH_HERO_SHELVES';
export const FETCH_HERO_SHELVES: 'FETCH_HERO_SHELVES' = 'FETCH_HERO_SHELVES';
export const LOAD_HERO_SHELVES: 'LOAD_HERO_SHELVES' = 'LOAD_HERO_SHELVES';

export type PrimaryHeroShelfExternalType = {|
  id: string,
  guid: string,
  homepage: string,
  name: string,
  type: string,
|};

export type ExternalPrimaryHeroShelfType = {|
  gradient: {|
    start: string,
    end: string,
  |},
  featured_image: string,
  description: string | null,
  addon: PartialExternalAddonType | void,
  external: PrimaryHeroShelfExternalType | void,
|};

export type PrimaryHeroShelfType = {|
  gradient: {|
    start: string,
    end: string,
  |},
  featuredImage: string,
  description: string | null,
  addon: AddonType | void,
  external: PrimaryHeroShelfExternalType | void,
|};

export type HeroCTAType = {|
  url: string,
  text: string,
|};

export type SecondaryHeroModuleType = {|
  icon: string,
  description: string,
  cta: HeroCTAType,
|};

export type SecondaryHeroShelfType = {|
  headline: string,
  description: string,
  cta: HeroCTAType,
  modules: Array<SecondaryHeroModuleType>,
|};

export type ExternalHeroShelvesType = {|
  primary: ExternalPrimaryHeroShelfType,
  secondary: SecondaryHeroShelfType,
|};

export type HeroShelvesType = {|
  primary: PrimaryHeroShelfType,
  secondary: SecondaryHeroShelfType,
|};

export type HeroShelvesState = {|
  heroShelves: HeroShelvesType | null | void,
  loading: boolean,
|};

export const initialState: HeroShelvesState = {
  heroShelves: undefined,
  loading: false,
};

type AbortFetchHeroShelvesAction = {|
  type: typeof ABORT_FETCH_HERO_SHELVES,
|};

export const abortFetchHeroShelves = (): AbortFetchHeroShelvesAction => {
  return { type: ABORT_FETCH_HERO_SHELVES };
};

type FetchHeroShelvesParams = {| errorHandlerId: string |};

export type FetchHeroShelvesAction = {|
  type: typeof FETCH_HERO_SHELVES,
  payload: FetchHeroShelvesParams,
|};

export const fetchHeroShelves = ({
  errorHandlerId,
}: FetchHeroShelvesParams): FetchHeroShelvesAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: FETCH_HERO_SHELVES,
    payload: { errorHandlerId },
  };
};

export type LoadHeroShelvesParams = {|
  heroShelves: ExternalHeroShelvesType,
|};

type LoadHeroShelvesAction = {|
  type: typeof LOAD_HERO_SHELVES,
  payload: LoadHeroShelvesParams,
|};

export const loadHeroShelves = ({
  heroShelves,
}: LoadHeroShelvesParams): LoadHeroShelvesAction => {
  invariant(heroShelves, 'heroShelves is required');

  return {
    type: LOAD_HERO_SHELVES,
    payload: { heroShelves },
  };
};

export const getHeroShelves = (
  heroState: HeroShelvesState,
): HeroShelvesType | null | void => {
  invariant(heroState, 'state is required');

  return heroState.heroShelves;
};

export const createInternalHeroShelves = (
  heroShelves: ExternalHeroShelvesType,
): HeroShelvesType => {
  const { primary, secondary } = heroShelves;

  return {
    primary: {
      gradient: primary.gradient,
      featuredImage: primary.featured_image,
      description: primary.description,
      addon: primary.addon ? createInternalAddon(primary.addon) : undefined,
      external: primary.external,
    },
    secondary,
  };
};

type Action =
  | AbortFetchHeroShelvesAction
  | FetchHeroShelvesAction
  | LoadHeroShelvesAction;

const reducer = (
  state: HeroShelvesState = initialState,
  action: Action,
): HeroShelvesState => {
  switch (action.type) {
    case ABORT_FETCH_HERO_SHELVES:
      return {
        ...state,
        heroShelves: null,
        loading: false,
      };

    case FETCH_HERO_SHELVES:
      return {
        ...state,
        heroShelves: null,
        loading: true,
      };

    case LOAD_HERO_SHELVES: {
      return {
        ...state,
        heroShelves: createInternalHeroShelves(action.payload.heroShelves),
        loading: false,
      };
    }

    default:
      return state;
  }
};

export default reducer;
