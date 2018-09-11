/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import cookie from 'react-cookie';

export type ExposedWithExperimentProps = {|
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
  WrappedComponent: Function,
  _cookie: typeof cookie,
  randomizer: () => number,
|};

const defaultCookieConfig = { path: '/' };

export const withExperiment = ({
  cookieConfig = defaultCookieConfig,
  id: defaultId,
  variantA: defaultVariantA,
  variantB: defaultVariantB,
}: Props) => (WrappedComponent: Function) => {
  class WithExperiment extends React.Component<InternalProps> {
    experimentCookie: string | void;

    static defaultProps = {
      _cookie: cookie,
      id: defaultId,
      variantA: defaultVariantA,
      variantB: defaultVariantB,
      randomizer: Math.random,
    };

    constructor(props: InternalProps) {
      super(props);

      const {
        _cookie,
        variantA,
        variantB,
        id: nameId,
        randomizer,
      } = this.props;

      invariant(variantA, 'variantA is required');
      invariant(variantB, 'variantB is required');
      invariant(nameId, 'id is required');

      // console.log('REBB cookieConfig', cookieConfig);

      this.experimentCookie = _cookie.load(this.getCookieName());

      if (this.experimentCookie === undefined) {
        this.experimentCookie = randomizer() >= 0.5 ? variantA : variantB;
        _cookie.save(this.getCookieName(), this.experimentCookie, cookieConfig);

        // console.log('REBB cookieConfig testttt', this.experimentCookie);
      }
    }

    getCookieName() {
      return `experiment_${this.props.id}`;
    }

    render() {
      const { _cookie, ...props } = this.props;

      const exposedProps: ExposedWithExperimentProps = {
        variant: _cookie.load(this.getCookieName()),
      };

      return <WrappedComponent {...exposedProps} {...props} />;
    }
  }

  return WithExperiment;
};
