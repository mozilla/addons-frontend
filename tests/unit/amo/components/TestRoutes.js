import * as React from 'react';
import { shallow } from 'enzyme';
import { Route } from 'react-router-dom';

import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Routes from 'amo/components/Routes';
import ServerError from 'amo/components/ErrorPage/ServerError';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<Routes {...props} />);
  };

  it('renders the routes for the amo app', () => {
    const root = render();
    expect(root.find(Route)).toHaveLength(26);
  });

  describe('path = /:lang/:application/401/', () => {
    const path = '/:lang/:application/401/';

    it('renders a NotAuthorized component in development', () => {
      const _config = getFakeConfig({ isDevelopment: true });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', NotAuthorized);
    });

    it('renders a NotFound component', () => {
      const _config = getFakeConfig({ isDevelopment: false });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', NotFound);
    });
  });

  describe('path = /:lang/:application/500/', () => {
    const path = '/:lang/:application/500/';

    it('renders a ServerError component in development', () => {
      const _config = getFakeConfig({ isDevelopment: true });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', ServerError);
    });

    it('renders a NotFound component', () => {
      const _config = getFakeConfig({ isDevelopment: false });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', NotFound);
    });
  });
});
