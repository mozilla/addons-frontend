/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import cookie from 'react-cookie';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withUIState from 'core/withUIState';
import tracking from 'core/tracking';
import type { AppState } from 'amo/store';

type Props = {|
  AName: string,
  BName: string,
  nameId: string,
|};

type UIStateType = {|
  abTest: string | void,
|};

type InternalProps = {|
  ...Props,
  _cookie: typeof cookie,
  _tracking: typeof tracking,
  randomizer: () => number,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
  WrappedComponent: Function,
|};

const initialUIState: UIStateType = {
  abTest: undefined,
};

export function mergeExperimentProps({
  WrappedComponent,
  nameId,
  AName,
  BName,
}: {|
  WrappedComponent: Function,
  nameId: string,
  AName: string,
  BName: string,
|}) {
  return function mapStateToProps(state: AppState, ownProps: Object) {
    return {
      ...ownProps,
      nameId,
      AName,
      BName,
      WrappedComponent,
    };
  };
}

export class Experiment extends React.Component<InternalProps> {
  abTestCookie: string | void;

  static defaultProps = {
    _cookie: cookie,
    _tracking: tracking,
    randomizer: Math.random,
  };

  componentDidMount() {
    const { _cookie, _tracking, AName, BName, nameId, randomizer } = this.props;

    this.abTestCookie = _cookie.load(`AB_${nameId}_COOKIE`);

    if (this.abTestCookie === undefined) {
      this.abTestCookie =
        randomizer() >= 0.5 ? `AB_${nameId}_${AName}` : `AB_${nameId}_${BName}`;
      _cookie.save(`AB_${nameId}_COOKIE`, this.abTestCookie, {
        path: '/', // TODO: make this flexible too possibly.
      });
    }

    if (this.abTestCookie) {
      this.props.setUIState({
        abTest: this.abTestCookie,
      });

      _tracking.sendEvent({
        action: `${nameId} Page View`,
        category: this.abTestCookie ? `AMO ${this.abTestCookie}` : '',
        label: '',
      });
    }
  }

  trackClick = (e: SyntheticEvent<any>, url: string = '') => {
    const { _cookie, _tracking, nameId } = this.props;

    const nodeType = e.currentTarget.nodeName.toLowerCase();

    if (nodeType === 'a') {
      _tracking.sendEvent({
        action: `${nameId} Click`,
        category: `AMO ${_cookie.load(`AB_${nameId}_COOKIE`)}`,
        label: url,
      });
    }
  };

  render() {
    const { WrappedComponent, _cookie, nameId, uiState, ...props } = this.props;

    invariant(nameId, 'nameId is required');

    const exposedPropHelpers = {
      trackClick: (...args) => this.trackClick(...args),
    };

    // When the cookie is initially set it will not be seen on client
    // until there is a refresh so we are also checking uiState.
    return (
      <WrappedComponent
        {...exposedPropHelpers}
        {...props}
        variant={_cookie.load(`AB_${nameId}_COOKIE`) || uiState.abTest}
      />
    );
  }
}

export const extractId = (ownProps: Props) => {
  return ownProps.nameId;
};

export function experiment({
  _mergeExperimentProps = mergeExperimentProps,
  nameId,
  AName,
  BName,
}: {|
  _mergeExperimentProps?: Function,
  nameId: string,
  AName: string,
  BName: string,
|}) {
  invariant(nameId, 'nameId is required');
  invariant(AName, 'AName is required');
  invariant(BName, 'BName is required');

  return (WrappedComponent: Function) =>
    compose(
      connect(
        _mergeExperimentProps({ WrappedComponent, nameId, AName, BName }),
      ),
      withUIState({
        fileName: __filename,
        extractId,
        initialState: initialUIState,
      }),
    )(Experiment);
}
