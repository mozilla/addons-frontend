/* global fetch */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createMemoryHistory } from 'history';
import 'isomorphic-fetch';

import { getAddonIconUrl } from 'amo/imageUtils';
import I18nProvider from 'amo/i18n/Provider';
import { makeI18n } from 'amo/i18n/utils';
import { createInternalAddon } from 'amo/reducers/addons';
import { setClientApp, setLang } from 'amo/reducers/api';
import createStore from 'amo/store';
import { nl2br, sanitizeHTML } from 'amo/utils';
import AddonBadges from 'amo/components/AddonBadges';
import AddonTitle from 'amo/components/AddonTitle';
import Footer from 'amo/components/Footer';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import type { AddonType } from 'amo/types/addons';

import './styles.scss';

const AMO_BASE_URL = 'https://addons.mozilla.org';

type StaticAddonCardProps = {|
  addon: AddonType,
|};

const StaticAddonCard = ({ addon }: StaticAddonCardProps) => {
  if (!addon) {
    return null;
  }

  const summary = addon.summary ? addon.summary : addon.description;

  return (
    <div className="StaticAddonCard" data-addon-id={addon.id}>
      <div className="AddonIcon">
        <div className="AddonIconWrapper">
          <img className="AddonIconImage" src={getAddonIconUrl(addon)} alt="" />
        </div>
      </div>

      <AddonTitle addon={addon} />

      <AddonBadges addon={addon} />

      <p
        className="AddonSummary"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={sanitizeHTML(nl2br(summary), ['a', 'br'])}
      />

      <GetFirefoxButton
        addon={addon}
        buttonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
        className="AddonFirefoxButton"
      />
    </div>
  );
};

const render = ({ app, lang, component }) => {
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

export const buildStaticAddonCard = async (props: {| addonId: number |}) => {
  const { addonId } = props;

  const app = 'firefox';
  const lang = 'en-US';

  try {
    const response = await fetch(
      `${AMO_BASE_URL}/api/v5/addons/addon/${addonId}/?lang=${lang}&app=${app}`,
    );
    const apiAddon = await response.json();
    const addon = createInternalAddon(apiAddon, lang);

    return render({ app, lang, component: <StaticAddonCard addon={addon} /> });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Error: ${e}`);
  }

  return null;
};

export const buildFooter = () => {
  const app = 'firefox';
  const lang = 'en-US';

  return render({ app, lang, component: <Footer noLangPicker /> });
};
