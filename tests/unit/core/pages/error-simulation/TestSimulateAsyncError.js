import { shallow } from 'enzyme';
import * as React from 'react';

import { SimulateAsyncErrorBase } from 'amo/pages/error-simulation/SimulateAsyncError';

describe(__filename, () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  function render(props = {}) {
    return shallow(<SimulateAsyncErrorBase {...props} />);
  }

  it('throws an async error', () => {
    render();
    // Trigger the setTimeout() callback:
    expect(() => clock.tick(50)).toThrowError(/simulated asynchronous error/);
  });
});
