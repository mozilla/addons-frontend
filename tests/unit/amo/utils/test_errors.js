import { shallow } from 'enzyme';
import * as React from 'react';
import { compose } from 'redux';

import GenericError from 'amo/components/ErrorPage/GenericError';
import NotFound from 'amo/components/ErrorPage/NotFound';
import {
  getErrorComponent,
  render404IfConfigKeyIsFalse,
} from 'amo/utils/errors';

describe(__filename, () => {
  describe('getErrorComponent', () => {
    it('returns the NotFound component when status is 404', () => {
      expect(getErrorComponent(404)).toEqual(NotFound);
    });

    it('returns the GenericError component when status is not 404', () => {
      expect(getErrorComponent(400)).toEqual(GenericError);
      expect(getErrorComponent(null)).toEqual(GenericError);
      expect(getErrorComponent(undefined)).toEqual(GenericError);
    });
  });

  describe('render404IfConfigKeyIsFalse', () => {
    const render = ({
      SomeComponent = () => <div />,
      _config = { get: () => true },
      configKey = 'someConfigKey',
      props = {},
    } = {}) => {
      const WrappedComponent = compose(
        render404IfConfigKeyIsFalse(configKey, { _config }),
      )(SomeComponent);

      return shallow(<WrappedComponent {...props} />);
    };

    it('requires a config key', () => {
      expect(() => render404IfConfigKeyIsFalse()).toThrowError(
        /configKey cannot be empty/,
      );
    });

    it('returns a 404 when disabled by the config', () => {
      const configKey = 'customConfigKey';
      const _config = {
        get: sinon.spy(() => false),
      };
      const SomeComponent = sinon.spy(() => <div />);

      const root = render({ _config, SomeComponent, configKey });

      expect(root.find(SomeComponent)).toHaveLength(0);
      expect(root.find(NotFound)).toHaveLength(1);
      sinon.assert.calledWith(_config.get, configKey);
    });

    it('passes through component and props when enabled', () => {
      const _config = { get: () => true };
      const SomeComponent = sinon.spy(() => <div />);
      const props = { color: 'orange', size: 'large' };

      const root = render({ _config, SomeComponent, props });

      expect(root.find(NotFound)).toHaveLength(0);

      expect(root.find(SomeComponent)).toHaveLength(1);
      expect(root.find(SomeComponent)).toHaveProp(props);
    });
  });
});
