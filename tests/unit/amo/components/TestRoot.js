import * as React from 'react';
import { withCookies } from 'react-cookie';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

import Root from 'amo/components/Root';
import translate from 'amo/i18n/translate';
import createStore from 'amo/store';
import {
  createHistory,
  dispatchClientMetadata,
  fakeCookies,
  fakeI18n,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const App = (props) => <div className="App" {...props} />;

  const mountApp = ({
    Child = App,
    connectedHistory,
    history = createHistory(),
    i18n = fakeI18n(),
    messages,
    store,
    ...props
  } = {}) => {
    let thingsFromCreateStore;

    if (!store || !connectedHistory) {
      thingsFromCreateStore = createStore({ history });
    }

    return render(
      <Root
        i18n={i18n}
        messages={messages}
        locale="en"
        history={connectedHistory || thingsFromCreateStore.connectedHistory}
        store={store || thingsFromCreateStore.store}
        {...props}
      >
        <Child />
      </Root>,
    );
  };

  it('renders children', () => {
    mountApp();

    expect(screen.getByClassName('App')).toBeInTheDocument();
  });

  it('provides i18n capability', () => {
    const AppWithI18n = translate()(({ i18n }) => (
      <App>
        <p>{i18n.gettext('hello')}</p>
      </App>
    ));

    mountApp({ Child: AppWithI18n });

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('provides routing capability', () => {
    const pathname = '/some/random/url';
    const history = createHistory({ initialEntries: [pathname] });

    const AppWithRouter = withRouter(({ location }) => (
      <App>
        <p>{location.pathname}</p>
      </App>
    ));

    mountApp({ Child: AppWithRouter, history });

    expect(screen.getByText(pathname)).toBeInTheDocument();
  });

  it('provides redux capability', () => {
    const lang = 'fr';
    const { store } = dispatchClientMetadata({ lang });

    const AppWithRedux = connect((state) => ({ language: state.api.lang }))(
      ({ language }) => (
        <App>
          <p>{language}</p>
        </App>
      ),
    );

    mountApp({ Child: AppWithRedux, store });

    expect(screen.getByText(lang)).toBeInTheDocument();
  });

  it('provides cookies capability', () => {
    const cookieValue = 'some cookie value';
    const _cookies = fakeCookies({
      get: jest.fn().mockReturnValue(cookieValue),
    });

    const AppWithCookies = withCookies(({ cookies }) => (
      <App>
        <p>{cookies.get()}</p>
      </App>
    ));

    mountApp({ Child: AppWithCookies, cookies: _cookies });
    expect(screen.getByText(cookieValue)).toBeInTheDocument();
  });
});
