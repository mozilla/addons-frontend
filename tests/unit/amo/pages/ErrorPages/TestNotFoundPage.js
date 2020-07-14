import { shallow } from 'enzyme';
import * as React from 'react';

import NotFound from 'amo/components/Errors/NotFound';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';

describe(__filename, () => {
  it('renders a NotFound component', () => {
    const root = shallow(<NotFoundPage />);

    expect(root.find(NotFound)).toHaveLength(1);
  });
});
