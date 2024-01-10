/* @flow */
/* global window */
import * as React from 'react';
import { withRouter } from 'react-router-dom';

import type { ReactRouterLocationType } from 'amo/types/router';

type Props = {|
  children: React.Node,
|};

type DefaultProps = {|
  _window: typeof window,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  location: ReactRouterLocationType,
|};

export class ScrollToTopBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _window: typeof window !== 'undefined' ? window : null,
  };

  componentDidUpdate(prevProps: InternalProps) {
    const { _window, location } = this.props;

    if (
      _window &&
      (location.pathname !== prevProps.location.pathname ||
        location.search !== prevProps.location.search)
    ) {
      _window.scrollTo(0, 0);
    }
  }

  render(): React.Node {
    return this.props.children || null;
  }
}

export default (withRouter(ScrollToTopBase): React.ComponentType<Props>);
