import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import { SimulateSyncErrorBase } from
  'core/containers/error-simulation/SimulateSyncError';

describe('SimulateSyncError', () => {
  function render(props = {}) {
    return renderIntoDocument(<SimulateSyncErrorBase {...props} />);
  }

  it('throws a simulated error', () => {
    assert.throws(() => render(), /simulated synchronous error/);
  });
});
