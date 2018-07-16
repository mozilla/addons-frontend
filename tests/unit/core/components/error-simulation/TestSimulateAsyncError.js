import * as React from 'react';
import { renderIntoDocument } from 'react-dom/test-utils';

import { SimulateAsyncErrorBase } from 'core/components/error-simulation/SimulateAsyncError';

describe(__filename, () => {
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
