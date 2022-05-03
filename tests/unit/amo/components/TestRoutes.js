import * as React from 'react';
import { shallow } from 'enzyme';
import { Route } from 'react-router-dom';

import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Routes from 'amo/components/Routes';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<Routes {...props} />);
  };

  it('renders the routes for the amo app', () => {
    const root = render();

    expect(root.find(Route)).toExist();
  });

  describe('path = /:lang/:application(firefox|android)/401/', () => {
    const path = '/:lang/:application(firefox|android)/401/';

    it('renders a NotAuthorized page in development', () => {
      const _config = getFakeConfig({ isDevelopment: true });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', NotAuthorizedPage);
    });

    it('renders a NotFound page', () => {
      const _config = getFakeConfig({ isDevelopment: false });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', NotFoundPage);
    });
  });

  describe('path = /:lang/:application(firefox|android)/500/', () => {
    const path = '/:lang/:application(firefox|android)/500/';

    it('renders a ServerError page in development', () => {
      const _config = getFakeConfig({ isDevelopment: true });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', ServerErrorPage);
    });

    it('renders a NotFound page', () => {
      const _config = getFakeConfig({ isDevelopment: false });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', NotFoundPage);
    });
  });

  describe('Block page', () => {
    const path =
      '/:lang/:application(firefox|android)/blocked-addon/:guid/:versionId?/';

    it('declares a route for the new Block page', () => {
      const root = render();

      expect(root.find({ path })).toHaveLength(1);
    });
  });
});
