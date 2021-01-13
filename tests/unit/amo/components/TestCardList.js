import { shallow } from 'enzyme';
import * as React from 'react';

import CardList from 'amo/components/CardList';

describe(__filename, () => {
  const render = (props) => {
    return shallow(<CardList {...props} />);
  };

  it('adds a CardList class', () => {
    const root = render();

    expect(root).toHaveClassName('CardList');
  });

  it('adds a custom CSS class', () => {
    const root = render({ className: 'SystematicDysfunctioner' });

    expect(root).toHaveClassName('SystematicDysfunctioner');
  });

  it('renders children', () => {
    const root = render({ children: <div>Child Content</div> });

    expect(root.children()).toHaveText('Child Content');
  });
});
