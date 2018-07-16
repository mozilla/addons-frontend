import * as React from 'react';
import { renderIntoDocument } from 'react-dom/test-utils';

import { SimulateSyncErrorBase } from 'core/components/error-simulation/SimulateSyncError';

describe(__filename, () => {
  function render(props = {}) {
    return renderIntoDocument(<SimulateSyncErrorBase {...props} />);
  }

  it('throws a simulated error', () => {
    expect(() => render()).toThrowError(/simulated synchronous error/);
  });
});
