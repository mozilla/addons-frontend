import { shallow } from 'enzyme';
import * as React from 'react';

import { SimulateSyncErrorBase } from 'amo/pages/error-simulation/SimulateSyncError';

describe(__filename, () => {
  function render(props = {}) {
    return shallow(<SimulateSyncErrorBase {...props} />);
  }

  it('throws a simulated error', () => {
    expect(() => render()).toThrowError(/simulated synchronous error/);
  });
});
