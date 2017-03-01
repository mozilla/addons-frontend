import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import { SimulateAsyncErrorBase } from
  'core/containers/error-simulation/SimulateAsyncError';

describe('SimulateAsyncError', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  function render(props = {}) {
    return renderIntoDocument(<SimulateAsyncErrorBase {...props} />);
  }

  it('throws an async error', () => {
    render();
    // Trigger the setTimeout() callback:
    assert.throws(() => clock.tick(50), /simulated asynchronous error/);
  });
});
