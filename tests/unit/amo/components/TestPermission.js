import * as React from 'react';

import Permission from 'amo/components/Permission';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultProps = {
    type: 'my-type',
    description: 'A description',
  };

  function render(props = {}) {
    return defaultRender(<Permission {...defaultProps} {...props} />);
  }

  it('renders an li element', () => {
    render();

    expect(screen.getByTagName('li')).toBeInTheDocument();
  });

  it('renders the description', () => {
    const description = 'It can access your bookmarks';
    render({ description });

    expect(screen.getByText(description)).toBeInTheDocument();
  });
});
