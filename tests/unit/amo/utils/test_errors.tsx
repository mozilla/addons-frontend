import * as React from 'react';
import { compose } from 'redux';

import { render404IfConfigKeyIsFalse } from 'amo/utils/errors';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('render404IfConfigKeyIsFalse', () => {
    const render = ({
      SomeComponent = () => <div />,
      _config = {
        get: () => true,
      },
      configKey = 'someConfigKey',
      props = {},
    } = {}) => {
      const WrappedComponent = compose(render404IfConfigKeyIsFalse(configKey, {
        _config,
      }))(SomeComponent);
      return defaultRender(<WrappedComponent {...props} />);
    };

    it('requires a config key', () => {
      expect(() => render404IfConfigKeyIsFalse()).toThrowError(/configKey cannot be empty/);
    });
    it('returns a 404 when disabled by the config', () => {
      const className = 'MyClass';
      const configKey = 'customConfigKey';
      const _config = {
        get: jest.fn(() => false),
      };
      const SomeComponent = jest.fn(() => <div className={className} />);
      render({
        _config,
        SomeComponent,
        configKey,
      });
      expect(screen.queryByClassName(className)).not.toBeInTheDocument();
      expect(screen.getByRole('heading', {
        name: 'Page not found',
      })).toBeInTheDocument();
      expect(_config.get).toHaveBeenCalledWith(configKey);
    });
    it('passes through component and props when enabled', () => {
      const _config = {
        get: () => true,
      };
      const SomeComponent = jest.fn((props) => <div>{props.color}</div>);
      const props = {
        color: 'orange',
        size: 'large',
      };
      render({
        _config,
        SomeComponent,
        props,
      });
      expect(screen.queryByRole('heading', {
        name: 'Page not found',
      })).not.toBeInTheDocument();
      expect(screen.getByText('orange')).toBeInTheDocument();
    });
  });
});