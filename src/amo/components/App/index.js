/* @flow */
/* global Navigator, navigator */
import config from 'config';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import NestedStatus from 'react-nested-status';
import { compose } from 'redux';

// We have to import these styles first to have them listed first in the final
// CSS file. See: https://github.com/mozilla/addons-frontend/issues/3565
// The order is important: font files need to be first, with the subset after
// the full font file.
import 'fonts/inter.scss';
import 'fonts/inter-subset.scss';
import 'normalize.css/normalize.css';
import './styles.scss';

/* eslint-disable import/first */
import Routes from 'amo/components/Routes';
import ScrollToTop from 'amo/components/ScrollToTop';
import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';
import { getClientAppAndLangFromPath, isValidClientApp } from 'amo/utils';
import { addChangeListeners } from 'amo/addonManager';
import {
  setClientApp as setClientAppAction,
  setUserAgent as setUserAgentAction,
} from 'amo/reducers/api';
import { setInstallState } from 'amo/reducers/installations';
import { CLIENT_APP_ANDROID } from 'amo/constants';
import ErrorPage from 'amo/components/ErrorPage';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';
import type { InstalledAddon } from 'amo/reducers/installations';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';
/* eslint-enable import/first */

interface MozNavigator extends Navigator {
  mozAddonManager?: Object;
}

type PropsFromState = {|
  clientApp: string,
  lang: string,
  userAgent: string | null,
|};

type DefaultProps = {|
  _addChangeListeners: (callback: Function, mozAddonManager: Object) => any,
  _navigator: typeof navigator | null,
  mozAddonManager: $PropertyType<MozNavigator, 'mozAddonManager'>,
  userAgent: string | null,
|};

type Props = {|
  ...PropsFromState,
  ...DefaultProps,
  handleGlobalEvent: () => void,
  i18n: I18nType,
  location: ReactRouterLocationType,
  setClientApp: (clientApp: string) => void,
  setUserAgent: (userAgent: string) => void,
|};

export function getErrorPage(status: number | null): () => React.Node {
  switch (status) {
    case 401:
      return NotAuthorizedPage;
    case 404:
      return NotFoundPage;
    case 500:
    default:
      return ServerErrorPage;
  }
}
export class AppBase extends React.Component<Props> {
  scheduledLogout: TimeoutID;

  static defaultProps: DefaultProps = {
    _addChangeListeners: addChangeListeners,
    _navigator: typeof navigator !== 'undefined' ? navigator : null,
    mozAddonManager: config.get('server')
      ? {}
      : (navigator: MozNavigator).mozAddonManager,
    userAgent: null,
  };

  componentDidMount() {
    const {
      _addChangeListeners,
      _navigator,
      handleGlobalEvent,
      mozAddonManager,
      setUserAgent,
      userAgent,
    } = this.props;

    // Use addonManager.addChangeListener to setup and filter events.
    _addChangeListeners(handleGlobalEvent, mozAddonManager);

    // If userAgent isn't set in state it could be that we couldn't get one
    // from the request headers on our first (server) request. If that's the
    // case we try to load them from navigator.
    if (!userAgent && _navigator && _navigator.userAgent) {
      log.info(
        'userAgent not in state on App load; using navigator.userAgent.',
      );
      setUserAgent(_navigator.userAgent);
    }
  }

  componentDidUpdate() {
    const { clientApp, location, setClientApp } = this.props;

    const { clientApp: clientAppFromURL } = getClientAppAndLangFromPath(
      location.pathname,
    );

    if (isValidClientApp(clientAppFromURL) && clientAppFromURL !== clientApp) {
      setClientApp(clientAppFromURL);
    }
  }

  render(): React.Node {
    const { clientApp, i18n, lang } = this.props;

    const i18nValues = {
      locale: lang,
    };

    let defaultTitle = i18n.sprintf(
      i18n.gettext('Add-ons for Firefox (%(locale)s)'),
      i18nValues,
    );
    let titleTemplate = i18n.sprintf(
      i18n.gettext('%(title)s – Add-ons for Firefox (%(locale)s)'),
      // We inject `%s` as a named argument to avoid localizer mistakes. Helmet
      // will replace `%s` by the title supplied in other pages.
      { ...i18nValues, title: '%s' },
    );

    if (clientApp === CLIENT_APP_ANDROID) {
      defaultTitle = i18n.sprintf(
        i18n.gettext('Add-ons for Firefox Android (%(locale)s)'),
        i18nValues,
      );
      titleTemplate = i18n.sprintf(
        i18n.gettext('%(title)s – Add-ons for Firefox Android (%(locale)s)'),
        // We inject `%s` as a named argument to avoid localizer mistakes.
        // Helmet will replace `%s` by the title supplied in other pages.
        { ...i18nValues, title: '%s' },
      );
    }

    return (
      <NestedStatus code={200}>
        <ScrollToTop>
          <Helmet defaultTitle={defaultTitle} titleTemplate={titleTemplate} />
          <ErrorPage getErrorComponent={getErrorPage}>
            <Routes />
          </ErrorPage>
        </ScrollToTop>
      </NestedStatus>
    );
  }
}

export const mapStateToProps = (state: AppState): PropsFromState => ({
  clientApp: state.api.clientApp,
  lang: state.api.lang,
  userAgent: state.api.userAgent,
});

export function mapDispatchToProps(dispatch: DispatchFunc): {|
  handleGlobalEvent: (payload: InstalledAddon) => void,
  setClientApp: (clientApp: string) => void,
  setUserAgent: (userAgent: string) => void,
|} {
  return {
    handleGlobalEvent(payload: InstalledAddon) {
      dispatch(setInstallState(payload));
    },
    setClientApp(clientApp: string) {
      dispatch(setClientAppAction(clientApp));
    },
    setUserAgent(userAgent: string) {
      dispatch(setUserAgentAction(userAgent));
    },
  };
}

const App: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(AppBase);

export default App;
