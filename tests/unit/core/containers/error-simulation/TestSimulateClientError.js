import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Simulate,
  renderIntoDocument,
} from 'react-dom/test-utils';

import { SimulateClientErrorBase } from
  'core/containers/error-simulation/SimulateClientError';

describe('SimulateClientError', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  function render(props = {}) {
    return findDOMNode(
      renderIntoDocument(<SimulateClientErrorBase {...props} />));
  }

  it('lets you trigger an error', () => {
    const root = render();
    const button = root.querySelector('button');
    expect(() => Simulate.click(button)).toThrowError(/simulated client error/);
  });

  it('toggles the trigger prompt', () => {
    const root = render();
    const button = root.querySelector('button');
    const triggerPrompt = '💣 Go ahead, trigger an error';

    expect(button.textContent).toEqual(triggerPrompt);
    expect(() => Simulate.click(button)).toThrowError();
    expect(button.textContent).toEqual('Nice! Check Sentry');

    // Trigger the setTimeout() callback:
    clock.tick(3000);
    expect(button.textContent).toEqual(triggerPrompt);
  });
});
