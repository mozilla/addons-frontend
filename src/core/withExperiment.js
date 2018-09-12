/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import cookie from 'react-cookie';

export type WithExperimentInjectedProps = {|
  variant: string,
|};

type Props = {|
  cookieConfig?: Object,
  id: string,
  variantA: string,
  variantB: string,
|};

type InternalProps = {|
  ...Props,
  WrappedComponent: React.ComponentType<any>,
  _cookie: typeof cookie,
  randomizer: () => number,
|};

const defaultCookieConfig = { path: '/' };

export const withExperiment = ({
  cookieConfig = defaultCookieConfig,
  id: defaultId,
  variantA: defaultVariantA,
  variantB: defaultVariantB,
}: Props) => (WrappedComponent: React.ComponentType<any>) => {
  class WithExperiment extends React.Component<InternalProps> {
    experimentCookie: string | void;

    static defaultProps = {
      _cookie: cookie,
      id: defaultId,
      randomizer: Math.random,
      variantA: defaultVariantA,
      variantB: defaultVariantB,
    };

    constructor(props: InternalProps) {
      super(props);

      const { _cookie, id, randomizer, variantA, variantB } = this.props;

      invariant(id, 'id is required');
      invariant(variantA, 'variantA is required');
      invariant(variantB, 'variantB is required');

      this.experimentCookie = _cookie.load(this.getCookieName());

      if (this.experimentCookie === undefined) {
        this.experimentCookie = randomizer() >= 0.5 ? variantA : variantB;
        _cookie.save(this.getCookieName(), this.experimentCookie, cookieConfig);
      }
    }

    getCookieName() {
      return `experiment_${this.props.id}`;
    }

    render() {
      const {
        _cookie,
        variantA,
        variantB,
        id,
        randomizer,
        ...props
      } = this.props;

      const exposedProps: WithExperimentInjectedProps = {
        variant: _cookie.load(this.getCookieName()),
      };

      return <WrappedComponent {...exposedProps} {...props} />;
    }
  }

  return WithExperiment;
};
