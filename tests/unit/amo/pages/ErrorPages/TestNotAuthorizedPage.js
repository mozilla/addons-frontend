import { shallow } from 'enzyme';
import * as React from 'react';

import NotAuthorized from 'amo/components/Errors/NotAuthorized';
import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';

describe(__filename, () => {
  it('renders a NotAuthorized component', () => {
    const root = shallow(<NotAuthorizedPage />);

    expect(root.find(NotAuthorized)).toHaveLength(1);
  });
});
