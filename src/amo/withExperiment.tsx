import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { withCookies, Cookies } from 'react-cookie';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { storeExperimentVariant } from 'amo/reducers/experiments';
import tracking from 'amo/tracking';
import { getDisplayName } from 'amo/utils';
import type { ExperimentsState } from 'amo/reducers/experiments';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';

/*  Usage
 *
 *  To add experiment support to a component, do the following:
 *
 *  1. Include `withExperiment()` in the `compose` function of the component.
 *  2. Set a unique `id` for the experiment in the call to `withExperiment`
 *     (see example below).
 *  3. Define a set of variants for the experiment in the call to
 *     `withExperiment`, each of which will be assigned an `id` and a
 *     `percentage` which represents the portion of users who will be assigned
 *     this variant (see example below).
 *  4. Optionally, specify a `shouldExcludeUser` function, which accepts an
 *     object argument with a `state` property and returns a boolean which is
 *     `true` if the user should be excluded from the experiment.
 *     If omitted there will be no exclusions.
 *
 *  Note: The sum of all `percentage` values must be exactly 1. An exception
 *        will be thrown if that is not the case.
 *
 *  Note: To create a portion of the user population who will not be enrolled
 *        in the experiment, assign a percentage to the special
 *        `NOT_IN_EXPERIMENT` variant.
 *
 *  Example:
 *
 *    withExperiment({
 *      experimentConfig: {
 *        id: '20210219_amo_some-experiment-id',
 *        variants: [
 *          { id: 'variant-a', percentage: 0.2 },
 *          { id: 'variant-b', percentage: 0.2 },
 *          { id: NOT_IN_EXPERIMENT, percentage: 0.6 },
 *        ],
 *        shouldExcludeUser({ state }) {
 *          const { userAgentInfo } = state.api;
 *          return isFirefox({ userAgentInfo });
 *        },
 *      },
 *    })
 *
 *  The above will create an experiment where 20% of the users will receive
 *  `variant-a`, 20% of users will receive `variant-b`, and 60% of users will
 *  not be enrolled in the experiment at all, and all Firefox users will be
 *  excluded.
 *
 */
// This value defaults to 30 days in seconds. This value should not be changed
// unless directed to do so by a requirements change.
// See https://github.com/mozilla/addons-frontend/issues/8515
export const DEFAULT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export const EXPERIMENT_COOKIE_NAME = 'frontend_active_experiments';
export const EXPERIMENT_ENROLLMENT_CATEGORY = 'AMO Experiment Enrollment -';
// This is a special variant value that indicates the the user is not enrolled
// in the experiment.
export const NOT_IN_EXPERIMENT = 'notInExperiment';
export const EXPERIMENT_ID_REGEXP: RegExp = /\d{8}_amo_.+/;
// The GA custom dimensions used for experimentId and variation.
export const EXPERIMENT_ID_GA_DIMENSION = 'dimension8';
export const EXPERIMENT_VARIATION_GA_DIMENSION = 'dimension9';
// https://github.com/reactivestack/cookies/tree/f9beead40a6bebac475d9bf17c1da55418d26751/packages/react-cookie#setcookiename-value-options
type CookieConfig = {
  maxAge?: number;
  path?: string;
  sameSite?: string;
  secure?: boolean;
};
type ExperimentVariant = {
  id: string;
  percentage: number;
};
export type ExperimentConfig = {
  cookieConfig?: CookieConfig;
  id: string;
  shouldExcludeUser?: (arg0: {
    state: AppState;
  }) => boolean;
  variants: ExperimentVariant[];
};
export type WithExperimentInjectedProps = {
  experimentId: string;
  isExperimentEnabled: boolean;
  isUserInExperiment: boolean;
  variant: string | null;
};
type WithExperimentProps = {
  _config?: typeof config;
  _tracking?: typeof tracking;
  experimentConfig: ExperimentConfig;
};
export const getVariant = ({
  randomizer = Math.random,
  variants,
}: {
  randomizer?: () => number;
  variants: ExperimentVariant[];
}): string => {
  invariant(variants.reduce((total, variant) => total + variant.percentage, 0) === 1, 'The sum of all percentages in `variants` must be 1');
  invariant(variants.every((variant) => variant.id.length <= 50), 'Variant ids must be no more than 50 characters long');
  const randomNumber = randomizer();
  let variantMin = 0;
  let variantMax;

  for (const variant of variants) {
    variantMax = variantMin + variant.percentage;

    if (randomNumber > variantMin && randomNumber <= variantMax) {
      return variant.id;
    }

    variantMin = variantMax;
  }

  // This should be impossible based on the `invariant` above, but it seems
  // like it's safer to keep it here.

  /* istanbul ignore next */
  throw new Error('Unable to allocate a user to a variant');
};
export const isExperimentEnabled = ({
  _config = config,
  id,
}: {
  _config: typeof config;
  id: string;
}): boolean => {
  const experiments = _config.get('experiments') || {};
  return experiments[id] === true;
};
type WithExperimentsPropsFromState = {
  storedVariants: ExperimentsState;
  isUserExcluded: boolean;
};
type WithExperimentInternalProps = WithExperimentProps & WithExperimentsPropsFromState & {
  _getVariant: typeof getVariant;
  _isExperimentEnabled: typeof isExperimentEnabled;
  cookies: typeof Cookies;
  dispatch: DispatchFunc;
  WrappedComponent: React.ComponentType<any>;
};
export const defaultCookieConfig: CookieConfig = {
  maxAge: DEFAULT_COOKIE_MAX_AGE,
  path: '/',
  // See https://github.com/mozilla/addons-frontend/issues/11836
  sameSite: 'strict',
  // See https://github.com/mozilla/addons-frontend/issues/8957
  secure: true,
};
export const withExperiment = ({
  _config = config,
  _tracking = tracking,
  experimentConfig,
}: WithExperimentProps): (WrappedComponent: React.ComponentType<any>) => React.ComponentType<any> => (WrappedComponent: React.ComponentType<any>) => {
  const {
    cookieConfig,
    id,
    shouldExcludeUser,
    variants,
  } = experimentConfig;
  invariant(id, 'id is required');
  invariant(EXPERIMENT_ID_REGEXP.test(id), 'id must match the pattern YYYYMMDD_amo_experiment_id');
  invariant(id.length <= 50, 'id must be no more than 50 characters long');
  invariant(variants, 'variants is required');

  class WithExperiment extends React.Component<WithExperimentInternalProps> {
    variant: string | null;

    static defaultProps = {
      _getVariant: getVariant,
      _isExperimentEnabled: isExperimentEnabled,
    };

    static displayName = `WithExperiment(${getDisplayName(WrappedComponent)})`;

    constructor(props: WithExperimentInternalProps) {
      super(props);
      this.variant = this.setupExperiment(props);
    }

    isEnabled() {
      return this.props._isExperimentEnabled({
        _config,
        id,
      });
    }

    readVariantFromCookie() {
      if (this.cookieIncludesExperiment()) {
        return this.getExperimentsFromCookie()[id];
      }

      return null;
    }

    // Returns a variant.
    setupExperiment(props) {
      const {
        _getVariant,
        dispatch,
        isUserExcluded,
        storedVariants,
      } = props;

      // If the experiment is not enabled, we return a null variant.
      if (!this.isEnabled()) {
        return null;
      }

      // Always use the variant from the cookie, if it exists.
      let variant = this.readVariantFromCookie();

      if (!variant) {
        const variantFromStore = storedVariants[id];

        // Look for a variant in the Redux store.
        if (variantFromStore) {
          variant = variantFromStore;
        } else // Otherwise if the user is to be excluded, use the NOT_IN_EXPERIMENT
          // variant.
          if (isUserExcluded) {
            variant = NOT_IN_EXPERIMENT;
          } else {
            variant = _getVariant({
              variants,
            });
          }

        // Do we need to store the variant in the cookie?
        if (!this.cookieIncludesExperiment() && !variantFromStore) {
          // Store the variant in the Redux store for use during
          // `componentDidMount()` and only when the user does not yet have a
          // variant in a cookie. In this case, the `experiments` state would
          // be empty, which is a bit unusual as we normally have consistent
          // states.
          dispatch(storeExperimentVariant({
            id,
            variant,
          }));
        }
      }

      return variant;
    }

    componentDidMount() {
      const {
        variant,
      } = this;
      const {
        _isExperimentEnabled,
        cookies,
      } = this.props;
      const addExperimentToCookie = variant && !this.cookieIncludesExperiment();
      const registeredExperiments = this.getExperimentsFromCookie();
      const experimentsToStore = { ...registeredExperiments,
      };
      // Clear any disabled experiments from the cookie.
      let cleanupNeeded = false;

      for (const experimentId of Object.keys(registeredExperiments)) {
        if (!_isExperimentEnabled({
          _config,
          id: experimentId,
        })) {
          delete experimentsToStore[experimentId];
          cleanupNeeded = true;
        }
      }

      if (addExperimentToCookie) {
        experimentsToStore[id] = variant;

        if (variant) {
          // Send an enrollment event.
          _tracking.sendEvent({
            _config,
            action: variant,
            category: [EXPERIMENT_ENROLLMENT_CATEGORY, id].join(' '),
          });
        }
      }

      if (cleanupNeeded || addExperimentToCookie) {
        cookies.set(EXPERIMENT_COOKIE_NAME, experimentsToStore, cookieConfig || defaultCookieConfig);
      }

      // If the user is enrolled in a branch, set the GA custom dimensions.
      if (variant && variant !== NOT_IN_EXPERIMENT) {
        _tracking.setDimension({
          dimension: EXPERIMENT_ID_GA_DIMENSION,
          value: id,
        });

        _tracking.setDimension({
          dimension: EXPERIMENT_VARIATION_GA_DIMENSION,
          value: variant,
        });
      }
    }

    getExperimentsFromCookie() {
      return this.props.cookies.get(EXPERIMENT_COOKIE_NAME) || {};
    }

    cookieIncludesExperiment() {
      return Object.keys(this.getExperimentsFromCookie()).includes(id);
    }

    render() {
      // We extract only the props we want to pass to the wrapper component.
      const {
        _getVariant,
        _isExperimentEnabled,
        ...otherProps
      } = this.props;
      // We should always read the variant from the cookie, unless it has not
      // been set yet, in which case the attribute should have it.
      const variant = this.readVariantFromCookie() || this.variant;
      const exposedProps: WithExperimentInjectedProps = {
        experimentId: id,
        isExperimentEnabled: this.isEnabled(),
        isUserInExperiment: Boolean(variant && variant !== NOT_IN_EXPERIMENT),
        variant,
      };
      return <WrappedComponent {...exposedProps} {...otherProps} />;
    }

  }

  const mapStateToProps = (state: AppState): WithExperimentsPropsFromState => {
    return {
      isUserExcluded: Boolean(shouldExcludeUser && shouldExcludeUser({
        state,
      })),
      storedVariants: state.experiments,
    };
  };

  return compose(withCookies, connect(mapStateToProps))(WithExperiment);
};