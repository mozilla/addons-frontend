import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import SimulateError from 'core/containers/SimulateError';

describe('SimulateError', () => {
  it('simulates an error', () => {
    assert.throws(
      () => renderIntoDocument(<SimulateError />),
      /simulated error/);
  });
});
