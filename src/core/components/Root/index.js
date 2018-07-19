/* @flow */
import * as React from 'react';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';

import I18nProvider from 'core/i18n/Provider';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterHistoryType } from 'core/types/router';

type Props = {|
  children: React.Node,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  store: Object,
|};

const Root = ({ children, history, i18n, store }: Props) => (
  <I18nProvider i18n={i18n}>
    <Provider store={store} key="provider">
      <ConnectedRouter history={history}>{children}</ConnectedRouter>
    </Provider>
  </I18nProvider>
);

export default Root;
