import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import NotFound from 'amo/components/ErrorPage/NotFound';
import createStore from 'amo/store';
import I18nProvider from 'core/i18n/Provider';
import SimulateError from 'core/containers/SimulateError';
import { getFakeI18nInst } from 'tests/client/helpers';

describe('SimulateError', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  function render(props = {}) {
    return renderIntoDocument(
      <Provider store={createStore()}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <SimulateError {...props} />
        </I18nProvider>
      </Provider>
    );
  }

  it('throws a simulated error', () => {
    assert.throws(() => render(), /simulated error in Component.render/);
  });

  it('throws an async error', () => {
    assert.throws(() => render());
    // Trigger the setTimeout() callback:
    assert.throws(() => clock.tick(50), /simulated error in the event loop/);
  });

  it('returns a 404 when disabled by the config', () => {
    const config = {
      get: sinon.spy(() => false),
    };
    const root = render({ config });
    const node = findRenderedComponentWithType(root, NotFound);

    assert.ok(node, '<NotFound /> was not rendered');
    assert.ok(config.get.called, 'config.get() was not called');
    assert.ok(config.get.firstCall.args[0], 'allowErrorSimulation');
  });
});
