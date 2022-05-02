import * as React from 'react';
import { shallow } from 'enzyme';
import { Route } from 'react-router-dom';

import Routes from 'amo/components/Routes';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<Routes {...props} />);
  };

  it('renders the routes for the amo app', () => {
    const root = render();

    expect(root.find(Route)).toExist();
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
