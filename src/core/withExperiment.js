/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import cookie from 'react-cookie';

import tracking from 'core/tracking';

type Props = {|
  AName: string,
  BName: string,
  nameId: string,
|};

type InternalProps = {|
  ...Props,
  _cookie: typeof cookie,
  _tracking: typeof tracking,
  randomizer: () => number,
  WrappedComponent: Function,
|};

export const withExperiment = ({
  nameId,
  AName,
  BName,
}: {|
  nameId: string,
  AName: string,
  BName: string,
|}) => (WrappedComponent: Function) => {
  class WithExperiment extends React.Component<InternalProps> {
    abTestCookie: string | void;

    static defaultProps = {
      nameId,
      AName: ANameVariant,
      BName: BNameVariant,
      _cookie: cookie,
      _tracking: tracking,
      randomizer: Math.random,
    };

    componentWillMount() {
      const {
        _cookie,
        _tracking,
        AName,
        BName,
        nameId: abNameId,
        randomizer,
      } = this.props;

      invariant(ANameVariant, 'AName is required');
      invariant(BNameVariant, 'BName is required');
      invariant(abNameId, 'nameId is required');

      this.abTestCookie = _cookie.load(`AB_${abNameId}_COOKIE`);

      if (this.abTestCookie === undefined) {
        this.abTestCookie =
          randomizer() >= 0.5
            ? `AB_${abNameId}_${ANameVariant}`
            : `AB_${abNameId}_${BNameVariant}`;
        _cookie.save(`AB_${abNameId}_COOKIE`, this.abTestCookie, {
          path: '/', // TODO: make this flexible too possibly.
        });
      }

      if (this.abTestCookie) {
        _tracking.sendEvent({
          action: `${abNameId} Page View`,
          category: this.abTestCookie ? `AMO ${this.abTestCookie}` : '',
          label: '',
        });
      }
    }

    trackClick = (e: SyntheticEvent<any>, url: string = '') => {
      const { _cookie, _tracking, nameId: abNameId } = this.props;

      const nodeType = e.currentTarget.nodeName.toLowerCase();

      if (nodeType === 'a') {
        _tracking.sendEvent({
          action: `${abNameId} Click`,
          category: `AMO ${_cookie.load(`AB_${abNameId}_COOKIE`)}`,
          label: url,
        });
      }
    };

    render() {
      const { _cookie, nameId: abNameId, ...props } = this.props;

      invariant(abNameId, 'nameId is required');

      const exposedPropHelpers = {
        trackClick: (...args) => this.trackClick(...args),
      };

      return (
        <WrappedComponent
          {...exposedPropHelpers}
          {...props}
          variant={_cookie.load(`AB_${abNameId}_COOKIE`)}
        />
      );
    }
  }

  return WithExperiment;
};
