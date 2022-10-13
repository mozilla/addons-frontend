import * as React from 'react';
import NestedStatus from 'react-nested-status';

import App from 'amo/components/App';
import { render } from 'tests/unit/helpers';

jest.mock('react-nested-status');
// This suite can be used for testing NestedStatus in different components.
describe(__filename, () => {
  it('renders a response with a 200 status for App', () => {
    render(<App />);
    expect(NestedStatus).toHaveBeenCalledWith(expect.objectContaining({
      code: 200,
    }), {});
  });
});