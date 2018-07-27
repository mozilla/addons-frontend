import * as React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-dom/test-utils';
import { compose } from 'redux';

import GenericError from 'core/components/ErrorPage/GenericError';
import NotFound from 'core/components/ErrorPage/NotFound';
import I18nProvider from 'core/i18n/Provider';
import {
  getErrorComponent,
  render404IfConfigKeyIsFalse,
} from 'core/utils/errors';
import { fakeI18n } from 'tests/unit/helpers';

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
    const render = (
      props = {},
      {
        SomeComponent = () => <div />,
        _config = { get: () => true },
        configKey = 'someConfigKey',
      } = {},
    ) => {
      const WrappedComponent = compose(
        render404IfConfigKeyIsFalse(configKey, { _config }),
      )(SomeComponent);

      return renderIntoDocument(
        <I18nProvider i18n={fakeI18n()}>
          <WrappedComponent {...props} />
        </I18nProvider>,
      );
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
      const root = render({}, { _config, configKey });
      const node = findRenderedComponentWithType(root, NotFound);

      expect(node).toBeTruthy();
      sinon.assert.calledWith(_config.get, configKey);
    });

    it('passes through component and props when enabled', () => {
      const _config = { get: () => true };
      const SomeComponent = sinon.spy(() => <div />);
      render({ color: 'orange', size: 'large' }, { SomeComponent, _config });

      sinon.assert.called(SomeComponent);
      const props = SomeComponent.firstCall.args[0];
      expect(props.color).toEqual('orange');
      expect(props.size).toEqual('large');
    });
  });
});
