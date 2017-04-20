import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Simulate,
  renderIntoDocument,
} from 'react-addons-test-utils';

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
    assert.throws(
      () => Simulate.click(button), /simulated client error/);
  });

  it('toggles the trigger prompt', () => {
    const root = render();
    const button = root.querySelector('button');
    const triggerPrompt = '💣 Go ahead, trigger an error';

    assert.equal(button.textContent, triggerPrompt);
    assert.throws(() => Simulate.click(button));
    assert.equal(button.textContent, 'Nice! Check Sentry');

    // Trigger the setTimeout() callback:
    clock.tick(3000);
    assert.equal(button.textContent, triggerPrompt);
  });
});
