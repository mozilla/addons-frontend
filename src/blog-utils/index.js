/* @flow */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import 'isomorphic-fetch';

import I18nProvider from 'amo/i18n/Provider';
import { makeI18n } from 'amo/i18n/utils';
import { setClientApp, setLang } from 'amo/reducers/api';
import createStore from 'amo/store';
import Footer from 'amo/components/Footer';
import Header from 'amo/components/Header';
import { createInternalAddon } from 'amo/reducers/addons';

import StaticAddonCard from './StaticAddonCard';

import './styles.scss';

const AMO_BASE_URL = 'https://addons.mozilla.org';

type RenderParams = {|
  app: string,
  lang: string,
  component: React.Node,
|};

const render = ({ app, lang, component }: RenderParams) => {
  // The first argument should be of type I18nConfig but we can pass an empty
  // object here because it's fine for en-US content.
  // $FlowIgnore: see comment above
  const jed = makeI18n({}, lang);
  const { connectedHistory, store } = createStore();

  store.dispatch(setClientApp(app));
  store.dispatch(setLang(lang));

  return renderToStaticMarkup(
    <I18nProvider jed={jed}>
      <Provider store={store}>
        <Router history={connectedHistory}>{component}</Router>
      </Provider>
    </I18nProvider>,
  );
};

export const buildFooter = (): string => {
  const app = 'firefox';
  const lang = 'en-US';

  return render({
    app,
    lang,
    component: <Footer noLangPicker />,
  });
};

export const buildHeader = (): string => {
  const app = 'firefox';
  const lang = 'en-US';

  return render({ app, lang, component: <Header forBlog /> });
};

type BuildStaticAddonCardParams = {|
  addonId: string,
  baseURL?: string,
|};

export const buildStaticAddonCard = async ({
  addonId,
  baseURL = AMO_BASE_URL,
}: BuildStaticAddonCardParams): Promise<string> => {
  const app = 'firefox';
  const lang = 'en-US';

  const response = await fetch(
    `${baseURL}/api/v5/addons/addon/${addonId}/?lang=${lang}&app=${app}`,
  );
  const apiAddon = await response.json();
  const addon = createInternalAddon(apiAddon, lang);

  return render({ app, lang, component: <StaticAddonCard addon={addon} /> });
};
