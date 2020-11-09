import { shallow } from 'enzyme';
import * as React from 'react';

import NotAvailableInRegion from 'amo/components/Errors/NotAvailableInRegion';
import NotAvailableInRegionPage from 'amo/pages/ErrorPages/NotAvailableInRegionPage';

describe(__filename, () => {
  it('renders a NotFound component', () => {
    const root = shallow(<NotAvailableInRegionPage />);

    expect(root.find(NotAvailableInRegion)).toHaveLength(1);
  });
});
