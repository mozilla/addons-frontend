/* @flow */
import config from 'config';
import * as React from 'react';
import { CookiesProvider, Cookies } from 'react-cookie';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';

import I18nProvider from 'amo/i18n/Provider';
import type { I18nType } from 'amo/types/i18n';
import type { ReduxStore } from 'amo/types/redux';
import type { ReactRouterHistoryType } from 'amo/types/router';

type Props = {|
  _config?: typeof config,
  children: React.Node,
  cookies?: typeof Cookies,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  store: ReduxStore,
|};

const Root = ({
  _config = config,
  children,
  history,
  i18n,
  store,
  cookies = null,
}: Props): React.Node => {
  return (
    <I18nProvider i18n={i18n}>
      <Provider store={store} key="provider">
        <Router history={history}>
          <CompatRouter>
            <CookiesProvider cookies={cookies}>
              {/* $FlowFixMe: https://github.com/facebook/react/issues/12553 */}
              {_config.get('enableStrictMode') ? (
                <React.StrictMode>{children}</React.StrictMode>
              ) : (
                children
              )}
            </CookiesProvider>
          </CompatRouter>
        </Router>
      </Provider>
    </I18nProvider>
  );
};

export default Root;
