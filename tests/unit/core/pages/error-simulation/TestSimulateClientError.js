import * as React from 'react';

import SimulateClientError, {
  SimulateClientErrorBase,
} from 'amo/pages/error-simulation/SimulateClientError';
import { shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  function render(props = {}) {
    return shallowUntilTarget(
      <SimulateClientError {...props} />,
      SimulateClientErrorBase,
    );
  }

  it('lets you trigger an error', () => {
    const root = render();

    expect(() => {
      root.find('.SimulateClientError-error').simulate('click');
    }).toThrowError(/simulated client error/);
  });

  it('toggles the trigger prompt', () => {
    const root = render();

    const triggerPrompt = '💣 Go ahead, trigger an error';
    expect(root.find('.SimulateClientError-error').children()).toHaveText(
      triggerPrompt,
    );

    expect(() => {
      root.find('.SimulateClientError-error').simulate('click');
    }).toThrow();

    root.update();
    expect(root.find('.SimulateClientError-error').children()).toHaveText(
      'Nice! Check Sentry',
    );

    // Trigger the setTimeout() callback:
    clock.tick(3000);
    root.update();

    expect(root.find('.SimulateClientError-error').children()).toHaveText(
      triggerPrompt,
    );
  });

  it('can throw a render error', () => {
    const root = render();

    expect(root).toHaveState('throwRenderError', false);

    expect(() => {
      root.find('.SimulateClientError-render-error').simulate('click');
    }).toThrowError(/simulated client render error/);

    expect(root).toHaveState('throwRenderError', true);
  });
});
