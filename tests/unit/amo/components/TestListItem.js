import * as React from 'react';

import ListItem from 'amo/components/ListItem';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    return defaultRender(<ListItem {...props} />);
  }

  it('renders children', () => {
    const text = 'Some text';
    render({ children: <div>{text}</div> });

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('lets you add a custom class name', () => {
    const className = 'MyClass';
    render({ className });

    const li = screen.getByRole('listitem');

    expect(li).toHaveClass('ListItem');
    expect(li).toHaveClass(className);
  });
});
