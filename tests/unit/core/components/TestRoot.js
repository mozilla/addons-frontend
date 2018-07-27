import { mount } from 'enzyme';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Root from 'core/components/Root';
import translate from 'core/i18n/translate';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeHistory,
  createFakeLocation,
  fakeI18n,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const App = (props) => <div className="App" {...props} />;

  const mountApp = ({
    Child = App,
    history = createFakeHistory(),
    i18n = fakeI18n(),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return mount(
      <Root i18n={i18n} history={history} store={store} {...props}>
        <Child />
      </Root>,
    );
  };

  it('renders children', () => {
    const root = mountApp();
    expect(root.find('.App')).toHaveLength(1);
  });

  it('provides i18n capability', () => {
    const AppWithI18n = translate()(({ i18n }) => (
      <App>
        <p>{i18n.gettext('hello')}</p>
      </App>
    ));

    const root = mountApp({ Child: AppWithI18n });
    expect(root.find('.App')).toHaveText('hello');
  });

  it('provides routing capability', () => {
    const pathname = '/some/random/url';
    const history = createFakeHistory({
      location: createFakeLocation({ pathname }),
    });

    const AppWithRouter = withRouter(({ location }) => (
      <App>
        <p>{location.pathname}</p>
      </App>
    ));

    const root = mountApp({ Child: AppWithRouter, history });
    expect(root.find('.App')).toHaveText(pathname);
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

    const root = mountApp({ Child: AppWithRedux, store });
    expect(root.find('.App')).toHaveText(lang);
  });
});
