import * as React from 'react';
import { shallow } from 'enzyme';
import { Route } from 'react-router-dom';

import GenericError from 'core/components/ErrorPage/GenericError';
import NotFound from 'core/components/ErrorPage/NotFound';
import Routes from 'disco/components/Routes';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<Routes {...props} />);
  };

  it('renders the routes for the disco app', () => {
    const root = render();
    expect(root.find(Route)).toHaveLength(7);
  });

  describe('path = /:lang/firefox/500', () => {
    const path = '/:lang/firefox/500';

    it('renders a GenericError component in development', () => {
      const _config = getFakeConfig({ isDevelopment: true });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', GenericError);
    });

    it('renders a NotFound component', () => {
      const _config = getFakeConfig({ isDevelopment: false });
      const root = render({ _config });

      expect(root.find({ path })).toHaveLength(1);
      expect(root.find({ path })).toHaveProp('component', NotFound);
    });
  });
});
