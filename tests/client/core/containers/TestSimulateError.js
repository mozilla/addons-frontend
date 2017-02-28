import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import SimulateError from 'core/containers/SimulateError';

describe('SimulateError', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('throws a simulated error', () => {
    assert.throws(
      () => renderIntoDocument(<SimulateError />),
      /simulated error in Component.render/);
  });

  it('throws an async error', () => {
    assert.throws(() => renderIntoDocument(<SimulateError />));
    // Trigger the setTimeout() callback:
    assert.throws(() => clock.tick(50), /simulated error in the event loop/);
  });
});
