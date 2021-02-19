/* @flow */
/* global window */
import * as React from 'react';
import { withRouter } from 'react-router-dom';

import type { ReactRouterLocationType } from 'amo/types/router';

type Props = {|
  _window: typeof window,
  children: React.Node,
  location: ReactRouterLocationType,
|};

export class ScrollToTopBase extends React.Component<Props> {
  static defaultProps: {| _window: any | null |} = {
    _window: typeof window !== 'undefined' ? window : null,
  };

  componentDidUpdate(prevProps: Props) {
    const { _window, location } = this.props;

    if (_window && location !== prevProps.location) {
      _window.scrollTo(0, 0);
    }
  }

  render(): React.Node {
    return this.props.children;
  }
}

export default (withRouter(ScrollToTopBase): any);
