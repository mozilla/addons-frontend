import { shallow } from 'enzyme';
import * as React from 'react';

import ServerError from 'amo/components/Errors/ServerError';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';

describe(__filename, () => {
  it('renders a ServerError component', () => {
    const root = shallow(<ServerErrorPage />);

    expect(root.find(ServerError)).toHaveLength(1);
  });
});
