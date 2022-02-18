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

  it('renders an icon with custom name', () => {
    const type = 'testType';
    render({ type });

    expect(
      screen.getByClassName(`Icon-permission-${type}`),
    ).toBeInTheDocument();
  });

  it('replaces dots in icon name with dashes', () => {
    render({ type: 'test.Type' });

    expect(
      screen.getByClassName('Icon-permission-test-Type'),
    ).toBeInTheDocument();
  });

  it('renders the description', () => {
    const description = 'It can access your bookmarks';
    render({ description });
    screen.debug();

    expect(screen.getByText(description)).toBeInTheDocument();
  });
});
