import * as React from 'react';
import { renderIntoDocument } from 'react-dom/test-utils';

import { SimulateSyncErrorBase } from 'core/containers/error-simulation/SimulateSyncError';

describe('SimulateSyncError', () => {
  function render(props = {}) {
    return renderIntoDocument(<SimulateSyncErrorBase {...props} />);
  }

  it('throws a simulated error', () => {
    expect(() => render()).toThrowError(/simulated synchronous error/);
  });
});
