import { createMemoryHistory } from 'history';
import * as React from 'react';
import { shallow } from 'enzyme';
import NestedStatus from 'react-nested-status';
import { Helmet } from 'react-helmet';

import App, { AppBase } from 'disco/components/App';
import Footer from 'disco/components/Footer';
import createStore from 'disco/store';
import {
  createContextWithFakeRouter,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render({
    browserVersion = '50',
    history = null,
    ...customProps
  } = {}) {
    if (!history) {
      // eslint-disable-next-line no-param-reassign
      history = createMemoryHistory({
        initialEntries: [
          `/en-US/firefox/discovery/pane/${browserVersion}/Darwin/normal/`,
        ],
      });
    }

    const store = customProps.store || createStore({ history }).store;

    const props = {
      history,
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(<App {...props} />, AppBase, {
      shallowOptions: createContextWithFakeRouter({ history }),
    });
  }

  const renderApp = (props = {}) => {
    return render(props).find('.App');
  };

  describe('App', () => {
    it('renders correctly', () => {
      const root = render();
      expect(root).toHaveLength(1);
      expect(root).toHaveProp('code', 200);
      expect(root.find('.App')).toHaveLength(1);
    });

    it('renders a ErrorPage', () => {
      const SomeErrorPage = () => <div />;
      const root = render({ ErrorPage: SomeErrorPage });
      expect(root.find(SomeErrorPage)).toHaveLength(1);
    });

    it('renders a Helmet', () => {
      const root = render();
      const helmet = root.find(Helmet);
      expect(helmet).toHaveLength(1);
      expect(helmet).toHaveProp('defaultTitle', 'Discover Add-ons');
      expect(helmet.find('meta')).toHaveLength(1);
      expect(helmet.find('meta')).toHaveProp('content', 'noindex');
    });

    it('renders a Footer', () => {
      const root = render();
      expect(root.find(Footer)).toHaveLength(1);
    });

    it('renders padding compensation class for FF < 50', () => {
      const root = renderApp({ browserVersion: '49.0' });
      expect(root).toHaveClassName('App--padding-compensation');
    });

    it('does not render padding compensation class for a bogus value', () => {
      const root = renderApp({ browserVersion: 'whatever' });
      expect(root).not.toHaveClassName('App--padding-compensation');
    });

    it('does not render padding compensation class for a undefined value', () => {
      const root = renderApp({ browserVersion: undefined });
      expect(root).not.toHaveClassName('App--padding-compensation');
    });

    it('does not render padding compensation class for FF == 50', () => {
      const root = renderApp({ browserVersion: '50.0' });
      expect(root).not.toHaveClassName('App--padding-compensation');
    });

    it('does not render padding compensation class for FF > 50', () => {
      const root = renderApp({ browserVersion: '52.0a1' });
      expect(root).not.toHaveClassName('App--padding-compensation');
    });

    it('renders a response with a 200 status', () => {
      const root = shallow(<AppBase i18n={fakeI18n()} browserVersion="50" />);
      expect(root.find(NestedStatus)).toHaveProp('code', 200);
    });

    it('sets browserVersion to empty string when path does not match', () => {
      const history = createMemoryHistory({
        initialEntries: ['/not-the-expected-path/'],
      });

      const root = render({ history });
      expect(root.instance().props).toHaveProperty('browserVersion', '');
    });
  });
});
