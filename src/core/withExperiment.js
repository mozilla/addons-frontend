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

export const withExperiment = ({ nameId, AName, BName }: Props) => (
  WrappedComponent: Function,
) => {
  class WithExperiment extends React.Component<InternalProps> {
    abTestCookie: string | void;

    static defaultProps = {
      _cookie: cookie,
      _tracking: tracking,
      AName,
      BName,
      nameId,
      randomizer: Math.random,
    };

    componentWillMount() {
      const {
        _cookie,
        _tracking,
        AName: ANameVariant,
        BName: BNameVariant,
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
            ? `AB_TEST_${abNameId}_${ANameVariant}`
            : `AB_TEST_${abNameId}_${BNameVariant}`;
        _cookie.save(`AB_${abNameId}_COOKIE`, this.abTestCookie, {
          path: '/', // TODO: make this flexible too possibly.
        });
      }

      if (this.abTestCookie) {
        _tracking.sendEvent({
          action: `${abNameId} Page View`,
          category: `AMO ${this.abTestCookie}`,
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
      const {
        _cookie,
        AName: ANameVariant,
        nameId: abNameId,
        ...props
      } = this.props;

      // We'll call the "AName" variant the "on" / "true" variant.
      const isOn =
        _cookie.load(`AB_${abNameId}_COOKIE`) ===
        `AB_TEST_${abNameId}_${ANameVariant}`;

      const exposedPropHelpers = {
        trackClick: (...args) => this.trackClick(...args),
      };

      return (
        <WrappedComponent
          {...exposedPropHelpers}
          {...props}
          experimentIsOn={isOn}
        />
      );
    }
  }

  return WithExperiment;
};
