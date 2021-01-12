/* @flow */
import config from 'config';
import * as React from 'react';
import invariant from 'invariant';
import { withCookies, Cookies } from 'react-cookie';

import log from 'amo/logger';
import tracking from 'amo/tracking';
import { getDisplayName } from 'amo/utils';

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
 *     withExperiment({
 *      id: 'some-experiment-id',
 *      variants: [
 *        { id: 'variant-a', percentage: 0.2 },
 *        { id: 'variant-b', percentage: 0.2 },
 *        { id: NOT_IN_EXPERIMENT, percentage: 0.6 },
 *      ],
 *     })
 *
 *  The above will create an experiment where 20% of the users will receive
 *  `variant-a`, 20% of users will receive `variant-b`, and 60% of users will
 *  not be enrolled in the experiment at all.
 *
 */

// This value defaults to 30 days in seconds. This value should not be changed
// unless directed to do so by a requirements change.
// See https://github.com/mozilla/addons-frontend/issues/8515
export const DEFAULT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export const EXPERIMENT_ENROLLMENT_CATEGORY = 'AMO Experiment Enrollment -';
// This is a special variant value that indicates the the user is not enrolled
// in the experiment.
export const NOT_IN_EXPERIMENT = 'notInExperiment';

export type WithExperimentInjectedProps = {|
  isExperimentEnabled: boolean,
  isUserInExperiment: boolean,
  variant: string | null,
|};

// https://github.com/reactivestack/cookies/tree/f9beead40a6bebac475d9bf17c1da55418d26751/packages/react-cookie#setcookiename-value-options
type CookieConfig = {|
  maxAge?: number,
  path?: string,
  secure?: boolean,
|};

type ExperimentVariant = {|
  id: string,
  percentage: number,
|};

type withExperimentProps = {|
  _tracking?: typeof tracking,
  cookieConfig?: CookieConfig,
  id: string,
  variants: ExperimentVariant[],
|};

export const getVariant = ({
  randomizer = Math.random,
  variants,
}: {|
  randomizer?: () => number,
  variants: ExperimentVariant[],
|}) => {
  invariant(
    variants.reduce((total, variant) => total + variant.percentage, 0) === 1,
    'The sum of all percentages in `variants` must be 1',
  );

  const randomNumber = randomizer();
  let variantMin = 0;
  let variantMax;
  for (const variant of variants) {
    variantMax = variantMin + variant.percentage;
    if (randomNumber > variantMin && randomNumber <= variantMax) {
      return variant;
    }
    variantMin = variantMax;
  }
  // This should be impossible based on the `invariant` above, but it seems
  // like it's safer to keep it here.
  throw new Error('Unable to allocate a user to a variant');
};

type withExperimentInternalProps = {|
  ...withExperimentProps,
  WrappedComponent: React.ComponentType<any>,
  _config: typeof config,
  _getVariant: typeof getVariant,
  cookies: typeof Cookies,
|};

export const defaultCookieConfig: CookieConfig = {
  maxAge: DEFAULT_COOKIE_MAX_AGE,
  path: '/',
  // See https://github.com/mozilla/addons-frontend/issues/8957
  secure: true,
};

export const withExperiment = ({
  _tracking = tracking,
  cookieConfig = defaultCookieConfig,
  id: defaultId,
  variants: defaultVariants,
}: withExperimentProps) => (WrappedComponent: React.ComponentType<any>) => {
  invariant(defaultId, 'id is required');
  invariant(defaultVariants, 'variants is required');

  class WithExperiment extends React.Component<withExperimentInternalProps> {
    experimentCookie: string | void;

    static defaultProps = {
      _config: config,
      _getVariant: getVariant,
      id: defaultId,
      variants: defaultVariants,
    };

    static displayName = `WithExperiment(${getDisplayName(WrappedComponent)})`;

    constructor(props: withExperimentInternalProps) {
      super(props);

      if (!this.isExperimentEnabled()) {
        log.debug(`Experiment "${props.id}" is not enabled by config.`);
        return;
      }

      const { _getVariant, cookies, id, variants } = this.props;

      this.experimentCookie = cookies.get(this.getCookieName());

      if (this.experimentCookie === undefined) {
        const variant = _getVariant({ variants });
        this.experimentCookie = variant.id;
        cookies.set(this.getCookieName(), this.experimentCookie, cookieConfig);
        if (variant.id !== NOT_IN_EXPERIMENT) {
          // send an enrollment event
          _tracking.sendEvent({
            action: variant.id,
            category: [EXPERIMENT_ENROLLMENT_CATEGORY, id].join(' '),
          });
        }
      }
    }

    getCookieName() {
      return `${this.props.id}Experiment`;
    }

    isExperimentEnabled() {
      const { _config, id } = this.props;

      return _config.get('experiments')[id] === true;
    }

    render() {
      const { cookies, id, ...props } = this.props;

      const isExperimentEnabled = this.isExperimentEnabled();
      const variant = isExperimentEnabled
        ? cookies.get(this.getCookieName())
        : null;

      const exposedProps: WithExperimentInjectedProps = {
        isExperimentEnabled,
        isUserInExperiment: variant !== null && variant !== NOT_IN_EXPERIMENT,
        variant,
      };

      return <WrappedComponent {...exposedProps} {...props} />;
    }
  }

  return withCookies(WithExperiment);
};
