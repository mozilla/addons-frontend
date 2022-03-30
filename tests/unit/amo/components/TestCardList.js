import * as React from 'react';

import CardList from 'amo/components/CardList';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props) => {
    return defaultRender(<CardList {...props} />);
  };

  it('adds a CardList class', () => {
    render();

    expect(screen.getByClassName('Card')).toHaveClass('CardList');
  });

  it('adds a custom CSS class', () => {
    render({ className: 'SystematicDysfunctioner' });

    expect(screen.getByClassName('Card')).toHaveClass('CardList');
    expect(screen.getByClassName('Card')).toHaveClass(
      'SystematicDysfunctioner',
    );
  });

  it('renders children', () => {
    render({ children: <div>Child Content</div> });

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
