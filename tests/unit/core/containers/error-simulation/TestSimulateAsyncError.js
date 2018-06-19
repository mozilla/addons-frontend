import * as React from 'react';
import { renderIntoDocument } from 'react-dom/test-utils';

import { SimulateAsyncErrorBase } from 'core/containers/error-simulation/SimulateAsyncError';

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
    expect(() => clock.tick(50)).toThrowError(/simulated asynchronous error/);
  });
});
