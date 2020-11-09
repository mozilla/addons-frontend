import { shallow } from 'enzyme';
import * as React from 'react';

import UnavailableForLegalReasons from 'amo/components/Errors/UnavailableForLegalReasons';
import UnavailableForLegalReasonsPage from 'amo/pages/ErrorPages/UnavailableForLegalReasonsPage';

describe(__filename, () => {
  it('renders a NotFound component', () => {
    const root = shallow(<UnavailableForLegalReasonsPage />);

    expect(root.find(UnavailableForLegalReasons)).toHaveLength(1);
  });
});
