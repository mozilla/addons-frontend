/* @flow */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createMemoryHistory } from 'history';

import I18nProvider from 'amo/i18n/Provider';
import { makeI18n } from 'amo/i18n/utils';
import { setClientApp, setLang } from 'amo/reducers/api';
import createStore from 'amo/store';
import Footer from 'amo/components/Footer';

import './styles.scss';

type RenderParams = {|
  app: string,
  lang: string,
  component: React.Node,
|};

const render = ({ app, lang, component }: RenderParams) => {
  // The first argument should be of type I18nConfig but we can pass an empty
  // object here because it's fine for en-US content.
  // $FlowIgnore: see comment above
  const i18n = makeI18n({}, lang);
  const { store } = createStore();

  store.dispatch(setClientApp(app));
  store.dispatch(setLang(lang));

  return renderToStaticMarkup(
    <I18nProvider i18n={i18n}>
      <Provider store={store}>
        <ConnectedRouter history={createMemoryHistory()}>
          {component}
        </ConnectedRouter>
      </Provider>
    </I18nProvider>,
  );
};

export const buildFooter = (): string => {
  const app = 'firefox';
  const lang = 'en-US';

  return render({ app, lang, component: <Footer noLangPicker /> });
};
