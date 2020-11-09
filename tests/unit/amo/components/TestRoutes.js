import * as React from 'react';
import { shallow } from 'enzyme';
import { Route } from 'react-router-dom';

import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotAvailableInRegionPage from 'amo/pages/ErrorPages/NotAvailableInRegionPage';
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

  describe('path = /:lang/:application/401/', () => {
    const path = '/:lang/:application/401/';

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

  describe('path = /:lang/:application/451/', () => {
    it('renders a NotAvailableInRegion page', () => {
      const path = '/:lang/:application/451/';
      const root = render();

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp(
        'component',
        NotAvailableInRegionPage,
      );
    });
  });

  describe('path = /:lang/:application/500/', () => {
    const path = '/:lang/:application/500/';

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
    const path = '/:lang/:application/blocked-addon/:guid/:versionId?/';

    it('declares a route for the new Block page if feature is enabled', () => {
      const _config = getFakeConfig({ enableFeatureBlockPage: true });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
    });

    it('does not declare a route for the new Block page if feature is disabled', () => {
      const _config = getFakeConfig({ enableFeatureBlockPage: false });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(0);
    });
  });
});
